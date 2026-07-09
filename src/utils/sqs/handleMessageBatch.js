const Joi = require("joi");
const logger = require("../logger");
const { getFileMetadataFromS3 } = require("../s3Service");
const modelFilemanager = require("../../models/fileManager");
const { repoDashLogs } = require("../../repositories/dashboardLogs");
const { utilActionType, utilResourceType } = require("../utilDashLogs");
const { emitUploadComplete } = require("../socket/progressBar");
const { validateOrThrow } = require("../middleware/joiValidator");

const handleMessageBatch = async (messages) => {
  logger.info(`Received batch of ${messages.length} messages from SQS`);

  const results = await Promise.allSettled(
    messages.map(async (message) => {
      try {
        logger.info(`Processing message ID: ${message.MessageId}`);
        const body = JSON.parse(message.Body);

        if (body.Records && Array.isArray(body.Records)) {
          for (const record of body.Records) {
            if (
              record.eventSource === "aws:s3" &&
              record.eventName?.startsWith("ObjectCreated")
            ) {
              const bucket = record.s3.bucket.name;
              const key = decodeURIComponent(
                record.s3.object.key.replaceAll("+", " "),
              );

              logger.info(`S3 event detected: ${bucket}/${key}`);

              const s3Response = await getFileMetadataFromS3(bucket, key);
              const metadata = s3Response.Metadata || {};

              logger.info(
                `Metadata retrieved for ${key}: ${JSON.stringify(metadata)}`,
              );

              // Metadata keys are returned in lowercase from S3
              const params = {
                companyID: metadata.companyid,
                filename: metadata.filename || key.split("/").pop(),
                identificator: key.split("/").pop().split(".")[0],
                size: parseInt(s3Response.ContentLength, 10),
                source: metadata.source || "filemanager",
                userID: metadata.userid,
                description: metadata.description || null,
              };

              const schema = Joi.object({
                companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
                filename: Joi.string().required(),
                identificator: Joi.string()
                  .uuid({ version: "uuidv4" })
                  .required(),
                size: Joi.number().required(),
                source: Joi.string().default("filemanager").required(),
                userID: Joi.string().required(),
                description: Joi.string().allow(null, "").optional(),
              });

              const values = validateOrThrow(schema, params);

              const { companyID, userID, filename } = values;

              await modelFilemanager.uploadFileMetadata(
                { companyID },
                {
                  filename,
                  size: values.size,
                  source: values.source,
                  identificator: values.identificator,
                  userID: userID,
                  description: values.description,
                },
              );

              await repoDashLogs.save({
                user_id: userID,
                action_type: utilActionType.Upload,
                resource_type: utilResourceType.File,
                name: filename || null,
                status: "success",
                company_id: companyID,
                metadata: {
                  ...values,
                },
              });

              if (values.source.toLowerCase() === "filemanager") {
                emitUploadComplete(
                  userID,
                  values.identificator,
                  "File uploaded successfully!",
                );
              }
            }
          }
        }
        return message;
      } catch (error) {
        logger.error(
          `Error processing message ID: ${message.MessageId}`,
          error,
        );
        throw error;
      }
    }),
  );

  const failedCount = results.filter(
    (result) => result.status === "rejected",
  ).length;

  const successfulMessages = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  logger.info(
    `Batch processing completed: ${successfulMessages.length} successful, ${failedCount} failed`,
  );

  return successfulMessages;
};

module.exports = handleMessageBatch;
