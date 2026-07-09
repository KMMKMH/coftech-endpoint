const { v4 } = require("uuid");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  ListObjectsV2Command,
  PutBucketCorsCommand,
  HeadObjectCommand,
  PutBucketTaggingCommand,
  GetBucketTaggingCommand,
  GetBucketNotificationConfigurationCommand,
  PutBucketNotificationConfigurationCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const NodeCache = require("node-cache");
const { getQueueArn } = require("./sqs/client");
const logger = require("./logger");

const s3 = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN && {
      sessionToken: process.env.AWS_SESSION_TOKEN,
    }),
  },
});

const bucketConfigCache = new NodeCache({ stdTTL: 6 * 60 * 60 });

const uploadFileToS3 = async (bucket, filePath, fileBuffer, contentType) => {
  try {
    await configureBucketNotification(bucket, process.env.AWS_SQS_FILEMANAGER_QUEUE_URL);
  } catch (error) {
    logger.warn(
      `Could not verify/configure notifications for bucket ${bucket}: ${error.message}`,
    );
  }

  const params = {
    Bucket: bucket,
    Key: filePath,
    Body: fileBuffer,
    ContentType: contentType,
  };

  try {
    logger.info(`Uploading file to S3: ${filePath}`);
    await s3.send(new PutObjectCommand(params));
    return `https://${bucket}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${filePath}`;
  } catch (error) {
    logger.error(`Error uploading file to S3: ${error.message}`);
    throw new Error(error);
  }
};

const deleteFileFromS3 = async (bucket, path) => {
  const fileKey = extractS3Key(path);

  const params = {
    Bucket: bucket,
    Key: fileKey,
  };

  try {
    const s3Response = await s3.send(new DeleteObjectCommand(params));
    logger.info(`File deleted from S3: ${fileKey}, ${s3Response}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting file from S3: ${error.message}`);
    throw new Error(error);
  }
};

const extractS3Key = (url) => {
  const urlObj = new URL(url);

  if (!url.includes(".s3.")) {
    throw new Error("URL does not belong to S3");
  }

  return urlObj.pathname.substring(1);
};

const getBucketFiles = async (bucket) => {
  const params = {
    Bucket: bucket,
  };

  try {
    return await s3.send(new ListObjectsV2Command(params));
  } catch (error) {
    logger.error(`Error getting bucket files: ${error.message}`);
    throw new Error(error);
  }
};

const createS3Bucket = async (bucketName) => {
  const params = {
    Bucket: bucketName,
  };

  const command = new CreateBucketCommand(params);

  try {
    const response = await s3.send(command);
    logger.info(`Bucket created: ${bucketName}`);

    const corsCommand = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT"],
            AllowedOrigins: ["*"],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    });

    await s3.send(corsCommand);
    logger.info(`CORS configuration applied to bucket: ${bucketName}`);

    await addOrUpdateBucketTag(bucketName, "S3-Cost-Center", bucketName);
    await configureBucketNotification(bucketName, process.env.AWS_SQS_FILEMANAGER_QUEUE_URL);

    return response;
  } catch (error) {
    logger.error(`Error creating bucket: ${error.message}`);
    throw new Error(error);
  }
};

const addOrUpdateBucketTag = async (bucketName, key, value) => {
  try {
    let existingTags = [];
    try {
      const getTagsCmd = new GetBucketTaggingCommand({ Bucket: bucketName });
      const tagData = await s3.send(getTagsCmd);
      existingTags = tagData.TagSet || [];
    } catch (err) {
      if (err.name !== "NoSuchTagSet") {
        throw err;
      }
    }

    const updatedTags = [
      ...existingTags.filter((tag) => tag.Key !== key),
      { Key: key, Value: value },
    ];

    const putTagsCmd = new PutBucketTaggingCommand({
      Bucket: bucketName,
      Tagging: { TagSet: updatedTags },
    });

    await s3.send(putTagsCmd);
    logger.info(`Tag "${key}=${value}" applied to bucket ${bucketName}`);
  } catch (error) {
    logger.error(`Failed to apply tag to bucket: ${error.message}`);
    throw error;
  }
};

const generateS3GetPresignedURL = async ({ key, origin_bucket }) => {
  const command = new GetObjectCommand({ Bucket: origin_bucket, Key: key });
  const url = await getSignedUrl(s3, command, { expiresIn: 30 * 60 });
  return { url };
};

const generateS3PutPresignedURL = async ({
  filePath,
  source,
  destination_bucket,
  botID,
  companyID,
  geminiApiKey,
  description,
  userID,
  useCompanyBucket = false,
}) => {
  const bucket = useCompanyBucket
    ? destination_bucket
    : process.env.ENVIRONMENT == "development" ||
        process.env.ENVIRONMENT == "test"
      ? process.env.AWS_S3_INPUT_BUCKET_TEST
      : process.env.AWS_S3_INPUT_BUCKET;

  const filename = filePath.split("/").pop();
  const extension = filePath.split(".").pop();
  const file_uuid = v4();

  const key = `${source}/${file_uuid}.${extension}`;

  const metadata = {
    ...(geminiApiKey && { geminiapikey: geminiApiKey }),
    ...(botID && { botid: botID }),
    ...(description && { description }),
    ...(userID && { userid: userID }),
    companyid: companyID,
    filename,
    destinationbucket: destination_bucket,
    source,
  };

  try {
    await configureBucketNotification(bucket, process.env.AWS_SQS_FILEMANAGER_QUEUE_URL);
  } catch (error) {
    logger.warn(
      `Could not verify/configure notifications for bucket ${bucket}: ${error.message}`,
    );
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Metadata: metadata,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 30 * 60 });

  return { url, file_uuid, bucket, key };
};

const formatBucketName = (name, id) => {
  const formattedName = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+|-+$/g, "");
  const uuid = id.split("-").pop();
  return `company-${formattedName}-${uuid}`;
};

const getFileMetadataFromS3 = async (bucket, filePath) => {
  const fileKey = filePath.includes("https://")
    ? extractS3Key(filePath)
    : filePath;

  const params = {
    Bucket: bucket,
    Key: fileKey,
  };

  try {
    const response = await s3.send(new HeadObjectCommand(params));
    return response;
  } catch (error) {
    logger.error(
      `Error getting metadata from S3 (Bucket: ${bucket}, Key: ${fileKey}): ${error.name} - ${error.message}`,
    );
    throw error;
  }
};

const configureBucketNotification = async (bucketName, queueUrl) => {
  try {
    const cacheKey = `${bucketName}:${queueUrl}`;

    if (bucketConfigCache.has(cacheKey)) {
      logger.info(
        `Notification configuration for bucket ${bucketName} found in cache.`,
      );
      return;
    }

    const queueArn = await getQueueArn(queueUrl);

    if (!queueArn) {
      throw new Error("Could not get the SQS queue ARN");
    }

    logger.info(
      `Configuring bucket notification for bucket: ${bucketName} with SQS ARN: ${queueArn}`,
    );

    const latestConfiguration = await s3.send(
      new GetBucketNotificationConfigurationCommand({ Bucket: bucketName }),
    );

    const newConfiguration = {
      QueueConfigurations: latestConfiguration.QueueConfigurations || [],
      TopicConfigurations: latestConfiguration.TopicConfigurations || [],
      LambdaFunctionConfigurations:
        latestConfiguration.LambdaFunctionConfigurations || [],
    };

    const exists = newConfiguration.QueueConfigurations.some(
      (config) => config.QueueArn === queueArn,
    );

    if (exists) {
      logger.info(
        `Notification configuration already exists for bucket: ${bucketName}`,
      );
      bucketConfigCache.set(cacheKey, true);
      return;
    }

    newConfiguration.QueueConfigurations.push({
      Events: ["s3:ObjectCreated:*"],
      QueueArn: queueArn,
      Id: `Notify-${Date.now()}`,
    });

    const putCommand = new PutBucketNotificationConfigurationCommand({
      Bucket: bucketName,
      NotificationConfiguration: newConfiguration,
    });

    await s3.send(putCommand);
    logger.info(`Bucket notification configured for bucket: ${bucketName}`);
    bucketConfigCache.set(cacheKey, true);
  } catch (error) {
    logger.error(`Error configuring bucket notification: ${error.message}`);
    throw new Error(error);
  }
};

module.exports = {
  uploadFileToS3,
  deleteFileFromS3,
  getBucketFiles,
  createS3Bucket,
  formatBucketName,
  getFileMetadataFromS3,
  addOrUpdateBucketTag,
  S3PresignedURL: {
    get: generateS3GetPresignedURL,
    put: generateS3PutPresignedURL,
  },
  configureBucketNotification,
};
