const Tesseract = require("tesseract.js");
const extractTextFromImage = require("../utils/ocr");

const processOCRImageToText = async ({ image }) => {
  const result = await Tesseract.recognize(
     
    Buffer.from(image, "base64"),
    "spa"
  );

  const detectedText = result.data.text.trim();

  if (detectedText.length) {
    return await extractTextFromImage(image);
  } else {
    return false;
  }
};

module.exports = {
  processOCRImageToText,
};
