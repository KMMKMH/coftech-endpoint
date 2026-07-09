const Joi = require("joi");
const modelOCR = require("../models/ocr");

const processOCRImageToText = async (req, res) => {
  try {
    const schemaBody = Joi.object({
      image: Joi.string()
        .pattern(/^((?!data:image\/\*;base64,).)*$/)
        .required(),
    });
    const { error: bodyError } = schemaBody.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelOCR.processOCRImageToText(req.body);

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

module.exports = {
  processOCRImageToText,
};
