const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");
const { isValidNumber } = require("libphonenumber-js");

const repoRaffle = require("../repositories/raffle");
const repoBots = require("../repositories/bots");
const repoCompany = require("../repositories/company");

const modelsBots = require("../models/bots");
const modelsOCR = require("../models/ocr");
const { generateRandomCode } = require("../utils/codeGenerator");
const { generateJWT } = require("../utils/generateJWT");
const { sendTriggerIntent } = require("./botMaker");

const handleVerificationCode = async (phone, verificationCodeField) => {
  if (verificationCodeField && verificationCodeField.status === "active") {
    const expirationTime = dayjs(verificationCodeField.expiration_time);
    const currentTime = dayjs();

    if (currentTime.isBefore(expirationTime)) {
      return {
        code: verificationCodeField.code,
        expiration_time: verificationCodeField.expiration_time,
      };
    } else {
      await repoRaffle.updateVerificationCodeStatus(
        verificationCodeField.uuid_unique,
        "expired"
      );
    }
  }

  const code = generateRandomCode(4);
  const expiration_time = dayjs()
    .add(10, "minute")
    .format("YYYY-MM-DD HH:mm:ss");

  const response = await repoRaffle.saveVerificationCode({
    code,
    phone,
    expiration_time,
  });

  if (!response) {
    throw new Error(`Error creating raffle verification code.`);
  }

  return { code, expiration_time };
};

const sendVerificationMessage = async (phone, code, botID) => {
  const [codeField] = await repoRaffle.getVerificationCodeByField({
    "raffle_auth_codes.phone": phone,
    "raffle_auth_codes.code": code,
  });

  const message = `Your verification code is: *${code}*. \nPlease note that your code will expire in *10 minutes.*`;

  const lastSent = codeField.last_sent ? dayjs(codeField.last_sent) : null;
  const currentTime = dayjs();

  if (!lastSent || currentTime.isAfter(lastSent.add(1, "minute"))) {
    await modelsBots.sendMessageBot({ botID }, { message, phone });

    const updateWhere = {
      uuid_unique: codeField.uuid_unique,
      phone,
    };

    const dataToUpdate = {
      last_sent: currentTime.format("YYYY-MM-DD HH:mm:ss"),
    };

    await repoRaffle.updateVerificationCode(updateWhere, dataToUpdate);
  }
};

const verifyRaffleUser = async (data, query) => {
  try {
    const { phone, contactId } = data;

    if (!isValidNumber(`+${phone || contactId}`)) {
      throw new Error("The phone number is not valid.");
    }

    let {
      result: [userField],
    } = await repoRaffle.getUsersByField({
      "raffle_users.phone": phone || contactId,
    });

    if (!userField) {
      userField = await repoRaffle.saveUser({ phone: phone || contactId });
      if (!userField) {
        throw new Error("Error creating raffle user.");
      }
    }

    const verificationCodeResponse = await createAndSendVerificationCode({
      phone,
      ...data,
      ...query,
    });

    delete userField.id;

    return {
      user: userField,
      verificationCodeResponse,
    };
  } catch (error) {
    throw new Error(error);
  }
};

const createAndSendVerificationCode = async (data) => {
  try {
    const { phone, contactId, botID, companyID } = data;

    if (botID) {
      const [botField] = await repoBots.getBotsByField({
        "bots.uuid_unique": botID,
      });
      if (!botField) {
        throw new Error(`Bot ID ${botID} not found.`);
      }
    }

    const [verificationCodeField] =
      await repoRaffle.getVerificationCodeByField({
        "raffle_auth_codes.phone": phone || contactId,
        "raffle_auth_codes.status": "active",
      });

    const { code, expiration_time } = await handleVerificationCode(
      phone || contactId,
      verificationCodeField
    );

    if (botID) {
      await sendVerificationMessage(phone, code, botID);
    } else {
      const { channelId, items } = data;

      for (const item of items) {
        const { intentIdOrName, variables } = item;

        let dataToSendCode = {
          channelId,
          contactId,
          intentIdOrName,
        };

        if (variables) {
          const { code: codeVariable } = variables;
          dataToSendCode = {
            ...dataToSendCode,
            variables: {
              [codeVariable]: code,
            },
          };
        }

        await sendTriggerIntent({ companyID }, dataToSendCode);
      }
    }

    return {
      expiration_time,
      phone,
    };
  } catch (error) {
    throw new Error(error);
  }
};

const verifyUserWithCode = async (code, phone) => {
  const {
    result: [userField],
  } = await repoRaffle.getUsersByField({
    "raffle_users.phone": phone,
  });

  if (!userField) {
    throw new Error(`user with phone ${phone} not exist.`);
  }

  delete userField.id;

  const [existingCodeField] = await repoRaffle.getVerificationCodeByField({
    "raffle_auth_codes.code": code,
    "raffle_auth_codes.phone": phone,
  });

  if (!existingCodeField) {
    throw new Error(`code not found.`);
  }

  if (
    existingCodeField.status === "used" ||
    existingCodeField.status === "expired"
  ) {
    throw new Error(`this code is ${existingCodeField.status}.`);
  }

  if (dayjs().isAfter(dayjs(existingCodeField.expiration_time))) {
    await repoRaffle.updateVerificationCodeStatus(
      existingCodeField.uuid_unique,
      "expired"
    );
    throw new Error("this code is expired.");
  }

  if (userField.is_active) {
    await repoRaffle.updateVerificationCodeStatus(
      existingCodeField.uuid_unique,
      "used"
    );

    const [userRoleField] = await repoRaffle.getUserRolesByField({
      "raffle_user_roles.user_id": userField.uuid_unique,
    });

    const jwtToken = generateJWT(
      "CoftechRaffle",
      {
        userField,
        ...(userRoleField && { role: userRoleField }),
      },
      process.env.JWT_RAFFLE_SECRET,  
      process.env.ENVIRONMENT == "development" ||  
        process.env.ENVIRONMENT == "test"  
        ? { expiresIn: "3d" }
        : { expiresIn: "259200000ms" }
    );

    const response = {
      jwtToken,
    };

    return response;
  }

  const updateWhere = {
    uuid_unique: userField.uuid_unique,
    phone: userField.phone,
  };

  const dataToUpdate = {
    is_active: true,
  };

  await repoRaffle.updateUser(updateWhere, dataToUpdate);

  const jwtToken = generateJWT(
    "CoftechRaffle",
    {
      userField,
    },
    process.env.JWT_RAFFLE_SECRET,  
    process.env.ENVIRONMENT == "development" ||  
      process.env.ENVIRONMENT == "test"  
      ? { expiresIn: "3d" }
      : { expiresIn: "259200000ms" }
  );

  const response = {
    jwtToken,
  };

  return response;
};

const updateUserInfo = async (query, body) => {
  const { phone, companyID, key } = query;

  try {
    if (key === "USER_DATA_PROFILE") {
      const dataToInsert = {
        reference: phone,
        company_id: companyID,
        key,
        data: JSON.stringify(body),
      };

      const [infoLogField] = await repoRaffle.getInfoLogsByField({
        "raffle_logs.reference": phone,
        "raffle_logs.company_id": companyID,
        "raffle_logs.key": key,
      });

      if (!infoLogField) {
        return await repoRaffle.saveInfoLog(dataToInsert);
      }

      const updateWhere = {
        "raffle_logs.uuid_unique": infoLogField.uuid_unique,
      };

      return await repoRaffle.updateInfoLog(updateWhere, dataToInsert);
    }

    const dataToInsert = {
      company_id: companyID,
      data: body,
      key,
    };

    const [infoLogField] = await repoRaffle.getInfoLogsByField({
      "raffle_logs.company_id": companyID,
      "raffle_logs.key": key,
    });

    if (!infoLogField) {
      return await repoRaffle.saveInfoLog(dataToInsert);
    }

    const updateWhere = {
      "raffle_logs.uuid_unique": infoLogField.uuid_unique,
    };

    return await repoRaffle.updateInfoLog(updateWhere, dataToInsert);
  } catch (error) {
    throw new Error(error);
  }
};

const verifyInvoice = async (query, body) => {
  const { companyID, phone, botID } = query;
  try {
    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const phoneNumberFormatted = phone.replace(/\D/g, "");
    const {
      result: [userField],
    } = await repoRaffle.getUsersByField({
      "raffle_users.phone": phoneNumberFormatted,
    });
    if (!userField) {
      throw new Error(`User with phone ${phoneNumberFormatted} not found.`);
    }
    const { uuid_unique: userID } = userField;

    const { invoice } = body;

    const ocrText = await modelsOCR.processOCRImageToText({ image: invoice });
    if (!ocrText) return false;

    const [wordsFindField] = await repoRaffle.getCompanyConfigsByField({
      company_id: companyID,
      key: "INVOICE_WORDS",
    });

    if (!wordsFindField) {
      await modelsBots.sendMessageBot(
        { botID },
        {
          message: "⚠️ The receipt could not be validated correctly. 📄",
          phone: userField.phone,
        }
      );
      console.log("No words to find in the invoice.");
      return;
    }

    const [amountFindField] = await repoRaffle.getCompanyConfigsByField({
      company_id: companyID,
      key: "INVOICE_AMOUNT",
    });
    if (!amountFindField) {
      await modelsBots.sendMessageBot(
        { botID },
        {
          message:
            "The receipt could not be validated. Please upload a complete photo where the information is readable.",
          phone: userField.phone,
        }
      );
      console.log("No amount to find in the invoice.");
      return;
    }

    let invoiceData;
    if (wordsFindField.data !== "" && amountFindField.data !== "") {
      invoiceData = checkInvoiceWords(ocrText, wordsFindField, amountFindField);
    }

    const { points: invoicePoints, reference, invoiceDate } = invoiceData;

    const [invoiceField] = await repoRaffle.getInvoiceByField({
      "raffle_invoices.reference": reference,
    });

    if (invoiceField) {
      await modelsBots.sendMessageBot(
        { botID },
        {
          message: "⚠️ The uploaded receipt was already registered.",
          phone: userField.phone,
        }
      );

      console.log(`Invoice with reference ${reference} already exists.`);
      return;
    }

    delete body.invoice;

    await repoRaffle.saveInvoice({
      "raffle_invoices.user_id": userID,
      "raffle_invoices.company_id": companyID,
      "raffle_invoices.points": parseInt(invoicePoints),
      "raffle_invoices.image": invoice,
      "raffle_invoices.reference": reference,
      "raffle_invoices.metadata": JSON.stringify({
        client: body ? body : null,
        invoice_text: ocrText,
        invoice_reference: reference,
        invoice_date: invoiceDate,
      }),
    });

    if (parseInt(invoicePoints) > 0) {
      const [lotteryTypeField] = await repoRaffle.getLotteryTypeByField({
        "raffle_lottery_types.lottery_type": "AUTO_JOIN_PER_POINTS",
      });
      if (lotteryTypeField) {
        const [lotteryField] = await repoRaffle.getLotteryByField({
          "raffle_lottery.company_id": companyID,
          "raffle_lottery.status": "IN_PROGRESS",
          "raffle_lottery.lottery_type": lotteryTypeField.uuid_unique,
        });
        if (lotteryField) {
          const [lotteryParticipantField] =
            await repoRaffle.getLotteryParticipantByField({
              "raffle_lottery_participants.lottery_id":
                lotteryField.uuid_unique,
              "raffle_lottery_participants.participant": userID,
            });
          if (!lotteryParticipantField) {
            await repoRaffle.saveLotteryParticipant({
              "raffle_lottery_participants.lottery_id":
                lotteryField.uuid_unique,
              "raffle_lottery_participants.participant": userID,
            });
          }
        }
      }
    }

    await modelsBots.sendMessageBot(
      { botID },
      {
        message: `Receipt ${reference} was uploaded successfully. Tickets earned: ${invoicePoints}.`,
        phone: userField.phone,
      }
    );

    return `Invoice with reference ${reference} has been successfully upload.`;
  } catch (error) {
    const phoneNumberFormatted = phone.replace(/\D/g, "");
    const {
      result: [userField],
    } = await repoRaffle.getUsersByField({
      "raffle_users.phone": phoneNumberFormatted,
    });
    if (!userField) {
      throw new Error(`User with phone ${phoneNumberFormatted} not found.`);
    }

    await modelsBots.sendMessageBot(
      { botID },
      {
        message: `The receipt could not be validated correctly.\nPlease try again and make sure the photo captures the full receipt and is readable.`,
        phone: userField.phone,
      }
    );

    throw new Error(error);
  }
};

const saveCompanyData = async (companyID, body) => {
  const { key, data } = body;

  const [companyConfigField] = await repoRaffle.getCompanyConfigsByField({
    company_id: companyID,
    key: key,
  });

  if (companyConfigField) {
    throw new Error(
      `Configuration with key ${key} already exists for company ID ${companyID}.`
    );
  }

  return repoRaffle.saveCompanyConfig({ company_id: companyID, key, data });
};

const getCompanyData = async (companyID) => {
  return await repoRaffle.getCompanyConfigsByField({
    company_id: companyID,
  });
};

const setCompanyConfigs = async (companyID) => {
  try {
    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const directoryPath = path.join(
      __dirname,  
      "../",
      "utils",
      "raffle_configs"
    );
    const fileNames = fs.readdirSync(directoryPath);

    if (!fileNames) {
      throw new Error(`File not found for setCompanyConfigs.`);
    }

    const insertedConfigs = [];
    const existingConfigs = [];

    for (const fileName of fileNames) {
      const fileConfig = require(path.join(directoryPath, fileName));

      for (const config of fileConfig) {
        const { key } = config;
        const [companyConfigField] =
          await repoRaffle.getCompanyConfigsByField({
            company_id: companyID,
            key,
          });
        if (!companyConfigField) {
          await repoRaffle.saveCompanyConfig({
            "raffle_company_configs.company_id": companyID,
            ...config,
          });
          insertedConfigs.push(config);
        } else {
          existingConfigs.push(key);
        }
      }
    }

    return {
      insertedConfigs,
      existingConfigs,
    };
  } catch (error) {
    throw new Error(error);
  }
};

const checkInvoiceWords = (ocrText, wordsFindField, amountFindField) => {
  let words = wordsFindField.data;
  let amountToPoint = amountFindField.data;

  const subWords = words.match(/\((.*?)\)/);
  if (subWords !== null) {
    const requiredKeywords = subWords[1]
      .split("|")
      .map((word) => word.trim())
      .filter((word) => word !== "");

    let found = false;
    for (const word of requiredKeywords) {
      if (ocrText.toLowerCase().includes(word.toLowerCase())) {
        found = true;
        break;
      }
    }
    if (!found) {
      throw new Error(
        `Invoice does not contain any of the ${requiredKeywords.join(",")}.`
      );
    }
    words = words
      .replace(/\((.*?)\)/, "")
      .trim()
      .split("|")
      .map((word) => word.trim())
      .filter((word) => word !== "");
  } else {
    words = words
      .split("|")
      .map((word) => word.trim())
      .filter((word) => word !== "");
  }

  for (const word of words) {
    if (!ocrText.toLowerCase().includes(word.toLowerCase())) {
      console.log(`Invoice does not contain ${word}.`);
      throw new Error(`Invoice validation failed.`);
    }
  }

  const subTotal = ocrText.split("\n");
  const formattedData = subTotal.reduce((acc, line, index) => {
    if (line.trim().match(/SUB[-\s]*TOTAL\s*:\s*\$/i)) {
      acc.subTotalNumber = subTotal[index + 1];
    } else if (line.trim().match(/INVOICE\s*:\s*([\w\d]+\s*\/?\s*[\d]+)/i)) {
      acc.reference = line
        .trim()
        .match(/INVOICE\s*:\s*([\w\d]+\s*\/?\s*[\d]+)/i)[1];
    } else if (line.trim().match(/DATE\s*:\s*(\d{2}\/\d{2}\/\d{4})/i)) {
      acc.invoiceDate = line
        .trim()
        .match(/DATE\s*:\s*(\d{2}\/\d{2}\/\d{4})/i)[1];
    }
    return acc;
  }, {});

  const { subTotalNumber, reference, invoiceDate } = formattedData;

  const subTotalFormatted = subTotalNumber.includes(",")
    ? subTotalNumber.replace(",", "")
    : subTotalNumber;

  const totalPoints = Math.floor(
    parseFloat(subTotalFormatted) / parseFloat(amountToPoint)
  );

  return { points: totalPoints, reference, invoiceDate };
};

const getInvoices = async (query) => {
  try {
    const { companyID, phone, invoiceID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    let userID;
    if (phone) {
      const phoneNumberFormatted = phone.replace(/\D/g, "");
      const {
        result: [userField],
      } = await repoRaffle.getUsersByField({
        "raffle_users.phone": phoneNumberFormatted,
      });

      if (!userField) {
        throw new Error(`User with phone ${phoneNumberFormatted} not found.`);
      }
      userID = userField.uuid_unique;
    }

    const response = await repoRaffle.getInvoiceByField(
      {
        "raffle_invoices.company_id": companyID,
        ...(userID && { "raffle_invoices.user_id": userID }),
        ...(invoiceID && { "raffle_invoices.uuid_unique": invoiceID }),
      },
      false,
      !userID && !invoiceID ? true : false
    );

    if (!invoiceID && userID) {
      return response.map((invoice) => {
        delete invoice.image;
        return invoice;
      });
    } else {
      return response;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const saveLottery = async (query, body) => {
  try {
    const { companyID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });

    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const { lottery_type_ID, start_date, end_date } = body;

    const [lotteryTypeField] = await repoRaffle.getLotteryTypeByField({
      "raffle_lottery_types.uuid_unique": lottery_type_ID,
    });

    if (!lotteryTypeField) {
      throw new Error(`Incorrect lottery type ID ${lottery_type_ID}.`);
    }
    const { lottery_type } = lotteryTypeField;

    const currentTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
    const startDateLoterry = dayjs(start_date)
      .format("YYYY-MM-DD HH:mm:ss")
      .toString();
    const endDateLoterry = dayjs(end_date)
      .format("YYYY-MM-DD HH:mm:ss")
      .toString();
    if (
      dayjs(startDateLoterry).isBefore(currentTime) ||
      dayjs(endDateLoterry).isBefore(currentTime)
    ) {
      throw new Error(`The start date must be greater than the current date.`);
    } else if (
      dayjs(endDateLoterry).isBefore(startDateLoterry) ||
      dayjs(endDateLoterry).isSame(startDateLoterry)
    ) {
      throw new Error(`The end date must be greater than the start date.`);
    }

    if (lottery_type === "AUTO_JOIN_PER_POINTS") {
      const lotteryField = await repoRaffle.getLotteryByField({
        "raffle_lottery.company_id": companyID,
        "raffle_lottery.lottery_type": lottery_type_ID,
      });

      for (const lottery of lotteryField) {
        const lotteryStartDate = dayjs(lottery.start_date)
          .format("YYYY-MM-DD")
          .toString();
        const lotteryEndDate = dayjs(lottery.end_date)
          .format("YYYY-MM-DD")
          .toString();
        if (
          lotteryStartDate ===
            dayjs(startDateLoterry).format("YYYY-MM-DD").toString() &&
          lotteryEndDate ===
            dayjs(endDateLoterry).format("YYYY-MM-DD").toString()
        ) {
          throw new Error(`The lottery already exists.`);
        }
      }
    }

    delete body.lottery_type_ID;

    const data = {
      company_id: companyID,
      lottery_type: lottery_type_ID,
      ...body,
    };

    return repoRaffle.saveLottery(data);
  } catch (error) {
    throw new Error(error);
  }
};

const updateLottery = async (query, body) => {
  const fieldsToUpdate = [
    "name",
    "description",
    "start_date",
    "end_date",
    "status",
  ];
  const { key, data } = body;
  const { lotteryID, companyID } = query;

  if (!fieldsToUpdate.includes(key)) {
    throw new Error(`The field "${key}" is not allowed to be updated.`);
  }

  const updateWhere = {
    "raffle_lottery.uuid_unique": lotteryID,
    "raffle_lottery.company_id": companyID,
  };

  const dataToUpdate = {
    [key]: data,
  };

  return repoRaffle.updateLottery(updateWhere, dataToUpdate);
};

const deleteLottery = async (query) => {
  const { lotteryID, companyID } = query;

  const deleteWhere = {
    "raffle_lottery.uuid_unique": lotteryID,
    "raffle_lottery.company_id": companyID,
  };

  return repoRaffle.deleteLottery(deleteWhere);
};

const getParticipants = async (query) => {
  try {
    const { companyID, lotteryID, phone } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const [lotteryField] = await repoRaffle.getLotteryByField({
      "raffle_lottery.uuid_unique": lotteryID,
    });
    if (!lotteryField) {
      throw new Error(`Incorrect lottery ID ${lotteryID}.`);
    }

    let userID;
    if (phone) {
      const phoneNumberFormatted = phone.replace(/\D/g, "");
      const {
        result: [userField],
      } = await repoRaffle.getUsersByField({
        "raffle_users.phone": phoneNumberFormatted,
      });
      if (!userField) {
        throw new Error(`User with phone ${phoneNumberFormatted} not found.`);
      }
      userID = userField.uuid_unique;
    }

    return await repoRaffle.getLotteryParticipantByField({
      "raffle_lottery_participants.lottery_id": lotteryID,
      "raffle_lottery_participants.company_id": companyID,
      ...(userID && { "raffle_lottery_participants.participant": userID }),
      "raffle_lottery_participants.status": true,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const updateParticipant = async (query, data) => {
  try {
    const { companyID, lotteryID, phone } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const [lotteryField] = await repoRaffle.getLotteryByField({
      "raffle_lottery.uuid_unique": lotteryID,
    });
    if (!lotteryField) {
      throw new Error(`Incorrect lottery ID ${lotteryID}.`);
    }

    const phoneNumberFormatted = phone.replace(/\D/g, "");
    const {
      result: [userField],
    } = await repoRaffle.getUsersByField({
      "raffle_users.phone": phoneNumberFormatted,
    });
    if (!userField) {
      throw new Error(`User with phone ${phoneNumberFormatted} not found.`);
    }
    const { uuid_unique: userID } = userField;

    const [participantField] = await repoRaffle.getLotteryParticipantByField(
      {
        "raffle_lottery_participants.lottery_id": lotteryID,
        "raffle_lottery_participants.participant": userID,
      }
    );
    if (!participantField) {
      throw new Error(
        `Participant with phone ${phoneNumberFormatted} not found in lottery ${lotteryID}.`
      );
    }

    const fieldsToUpdate = ["status"];

    let dataUpdate = {};

    fieldsToUpdate.forEach((field) => {
      if (data[field] != undefined && data[field] != participantField[field]) {
        dataUpdate[field] = data[field];
      }
    });

    if (Object.keys(dataUpdate).length > 0) {
      return await repoRaffle.updateLotteryParticipant(
        {
          "raffle_lottery_participants.lottery_id": lotteryID,
          "raffle_lottery_participants.participant": userID,
        },
        dataUpdate
      );
    } else {
      return true;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const saveParticipant = async (query) => {
  try {
    const { companyID, lotteryID, phone } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const [lotteryField] = await repoRaffle.getLotteryByField({
      "raffle_lottery.uuid_unique": lotteryID,
    });
    if (!lotteryField) {
      throw new Error(`Incorrect lottery ID ${lotteryID}.`);
    }

    if (lotteryField.company_id !== companyID) {
      throw new Error(
        `Incorrect lottery ID ${lotteryID} for company ID ${companyID}.`
      );
    }

    const phoneNumberFormatted = phone.replace(/\D/g, "");
    const {
      result: [userField],
    } = await repoRaffle.getUsersByField({
      "raffle_users.phone": phoneNumberFormatted,
    });
    if (!userField) {
      throw new Error(`Incorrect phone: ${phoneNumberFormatted}.`);
    }
    const { uuid_unique: userID } = userField;

    const { end_date, start_date } = lotteryField;
    const currentTime = dayjs();

    if (
      currentTime.isBefore(dayjs(start_date)) ||
      currentTime.isAfter(dayjs(end_date))
    ) {
      throw new Error(`The lottery is not active.`);
    }

    return await repoRaffle.saveLotteryParticipant({
      "raffle_lottery_participants.lottery_id": lotteryID,
      "raffle_lottery_participants.participant": userID,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const saveLotteryConfig = async (query, body) => {
  const { lotteryID } = query;

  const data = {
    lottery_id: lotteryID,
    ...body,
  };

  return repoRaffle.saveLotteryConfig(data);
};

const updateLotteryConfigs = async (query, body) => {
  const { lotteryID } = query;

  const updateWhere = {
    "raffle_lottery_configs.lottery_id": lotteryID,
  };

  return repoRaffle.updateLotteryConfigs(updateWhere, body);
};

const updateInvoice = async (query, data) => {
  try {
    const { companyID, phone, invoiceID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    const phoneNumberFormatted = phone.replace(/\D/g, "");
    const {
      result: [userField],
    } = await repoRaffle.getUsersByField({
      "raffle_users.phone": phoneNumberFormatted,
    });
    if (!userField) {
      throw new Error(`User with phone ${phoneNumberFormatted} not found.`);
    }

    const { uuid_unique: userID } = userField;
    const [invoiceField] = await repoRaffle.getInvoiceByField({
      "raffle_invoices.uuid_unique": invoiceID,
      "raffle_invoices.user_id": userID,
    });
    if (!invoiceField) {
      throw new Error(`Incorrect invoice ID ${invoiceID}.`);
    }

    const fieldsToUpdate = ["reference", "points"];

    let dataUpdate = {};

    fieldsToUpdate.forEach((field) => {
      if (data[field] != undefined && data[field] != invoiceField[field]) {
        dataUpdate[field] = data[field];
      }
    });

    if (Object.keys(dataUpdate).length > 0) {
      return await repoRaffle.updateInvoice(
        {
          "raffle_invoices.uuid_unique": invoiceID,
          "raffle_invoices.user_id": userID,
        },
        dataUpdate
      );
    } else {
      return true;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const deleteRole = async (query) => {
  const { roleID } = query;

  const deleteWhere = {
    "raffle_roles.uuid_unique": roleID,
  };

  return repoRaffle.deleteRole(deleteWhere);
};

const updateRole = async (query, body) => {
  const fieldsToUpdate = ["name"];
  const { key, data } = body;
  const { rolID } = query;

  if (!fieldsToUpdate.includes(key)) {
    throw new Error(`The field "${key}" is not allowed to be updated.`);
  }

  const updateWhere = {
    "raffle_roles.uuid_unique": rolID,
  };

  const dataToUpdate = {
    [key]: data,
  };

  return repoRaffle.updateRole(updateWhere, dataToUpdate);
};

const saveUserRole = async (query, body) => {
  const { roleID } = body;
  const { userID, companyID } = query;

  const data = {
    role_id: roleID,
    user_id: userID,
    company_id: companyID,
  };

  return repoRaffle.saveUserRole(data);
};

const updateUserRole = async (query, body) => {
  const { userID, companyID } = query;
  const { role_id } = body;
  const updateWhere = {
    "raffle_user_roles.company_id": companyID,
    "raffle_user_roles.user_id": userID,
  };

  const dataToUpdate = {
    role_id,
  };

  return repoRaffle.updateUserRole(updateWhere, dataToUpdate);
};

const deleteUserRole = async (query) => {
  const { companyID, userID } = query;

  const deleteWhere = {
    "raffle_user_roles.company_id": companyID,
    "raffle_user_roles.user_id": userID,
  };

  return repoRaffle.deleteUserRole(deleteWhere);
};

const getLotteryWinner = async (query) => {
  try {
    const { companyID } = query;

    const [companyField] = await repoCompany.getCompanyByField({
      "company.uuid_unique": companyID,
    });
    if (!companyField) {
      throw new Error(`Incorrect company ID ${companyID}.`);
    }

    return await repoRaffle.getLotteryWinner();
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  createAndSendVerificationCode,
  verifyRaffleUser,
  verifyUserWithCode,
  updateUserInfo,
  verifyInvoice,
  saveCompanyData,
  getCompanyData,
  setCompanyConfigs,
  getInvoices,
  getParticipants,
  saveLottery,
  updateLottery,
  deleteLottery,
  updateParticipant,
  saveParticipant,
  saveLotteryConfig,
  updateLotteryConfigs,
  updateInvoice,
  deleteRole,
  updateRole,
  saveUserRole,
  updateUserRole,
  deleteUserRole,
  getLotteryWinner,
};
