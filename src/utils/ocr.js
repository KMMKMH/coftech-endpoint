const {
  TextractClient,
  AnalyzeDocumentCommand,
} = require("@aws-sdk/client-textract");
const { Buffer } = require("buffer");

const extractTextFromImage = async (base64Image) => {
  const client = new TextractClient({
    region: process.env.AWS_DEFAULT_REGION,  
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,  
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,  
    },
  });

  const imageBytes = Buffer.from(base64Image, "base64");

  const params = {
    Document: {
      Bytes: imageBytes,
    },
    FeatureTypes: ["TABLES", "FORMS"],
  };

  try {
    const command = new AnalyzeDocumentCommand(params);
    const data = await client.send(command);
    const extractedText = data.Blocks.filter(
      (block) => block.BlockType === "LINE"
    )
      .map((block) => block.Text)
      .join("\n");

    return extractedText;
  } catch (err) {
    throw new Error(`Error analyzing document: ${err.message}`);
  }
};

module.exports = extractTextFromImage;
