const Joi = require("joi");
const parsePhoneNumber = require("libphonenumber-js");
const modelAgenda = require("../models/agenda");

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const getAgendaReserves = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      event_type_id: Joi.string().allow("", null),
      status_id: Joi.string().allow("", null),
      date: Joi.date().allow("", null),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelAgenda.getAgendaReserves(req.query);

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

const getAgendaReservesStatus = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelAgenda.getAgendaReservesStatus(req.query);

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

const createAgendaReserve = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      botID: Joi.string().allow("", null),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().required(),
      date: Joi.date().required(),
      participants: Joi.array().min(1).items(Joi.string()).required(),
      phone_numbers: Joi.array().items(Joi.string()).allow("", null),
      event_type_id: Joi.string().required(),
      public_notes: Joi.string().allow("", null),
      private_notes: Joi.string().allow("", null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { participants, phone_numbers } = req.body;
    const uniqueParticipants = new Set();
    let uniquePhoneNumbers;

    for (const participant of participants) {
      if (!uniqueParticipants.has(participant)) {
        uniqueParticipants.add(participant);
      }
    }

    if (phone_numbers) {
      uniquePhoneNumbers = new Set();

      for (const number of phone_numbers) {
        const phone = number.startsWith("+") ? number : `+${number}`;
        const phoneNumber = parsePhoneNumber(`${phone}`);
        if (!phoneNumber || !phoneNumber.isValid()) {
          throw new Error(`Invalid phone number ${number}`);
        }

        if (!uniquePhoneNumbers.has(phone)) {
          uniquePhoneNumbers.add(phone);
        }
      }
    }

    const response = await modelAgenda.createAgendaReserve(req.query, {
      ...req.body,
      participants: Array.from(uniqueParticipants),
      phone_numbers: uniquePhoneNumbers ? Array.from(uniquePhoneNumbers) : null,
    });

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

const updateAgendaReserve = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      agendaReserveID: Joi.string().required(),
      botID: Joi.string().allow("", null),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().allow("", null),
      date: Joi.date().allow("", null),
      participants: Joi.array().min(1).items(Joi.string()).allow("", null),
      phone_numbers: Joi.array().items(Joi.string()).allow("", null),
      event_type_id: Joi.string().allow("", null),
      public_notes: Joi.string().allow("", null),
      private_notes: Joi.string().allow("", null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { participants, phone_numbers } = req.body;
    let uniqueParticipants;
    let uniquePhoneNumbers;

    if (participants) {
      uniqueParticipants = new Set();

      for (const participant of participants) {
        if (!uniqueParticipants.has(participant)) {
          uniqueParticipants.add(participant);
        }
      }
    }

    if (phone_numbers) {
      uniquePhoneNumbers = new Set();

      for (const number of phone_numbers) {
        const phone = number.startsWith("+") ? number : `+${number}`;
        const phoneNumber = parsePhoneNumber(`${phone}`);
        if (!phoneNumber || !phoneNumber.isValid()) {
          throw new Error(`Invalid phone number ${number}`);
        }

        if (!uniquePhoneNumbers.has(phone)) {
          uniquePhoneNumbers.add(phone);
        }
      }
    }

    const response = await modelAgenda.updateAgendaReserve(req.query, {
      ...req.body,
      participants: participants ? Array.from(uniqueParticipants) : null,
      phone_numbers: phone_numbers ? Array.from(uniquePhoneNumbers) : null,
    });
    
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

const deleteAgendaReserve = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      agendaReserveID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelAgenda.deleteAgendaReserve(req.query);

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

const getAgendaLinkDetails = async (req, res) => {
  try {
    const querySchema = Joi.object({
      key: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelAgenda.getAgendaLink(req.query);

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
}

const joinAgendaLinkReserve = async (req, res) => {
  try {
    const querySchema = Joi.object({
      key: Joi.string().required(),
      phone: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const { phone, key } = req.query;
    const formatedPhone = phone.startsWith("+") ? phone : `+${phone}`;
    const phoneNumber = parsePhoneNumber(formatedPhone);

    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error(`Invalid phone number ${phone}`);
    }

    const response = await modelAgenda.joinAgendaLinkReserve({
      key,
      phone: formatedPhone,
    });

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
}

const getAgendaLinksByCompany = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelAgenda.getAgendaLinksByCompany(req.query);

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
}

const createAgendaLink = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      reserveID: Joi.string().required(),
    });
    
    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelAgenda.createAgendaLink(req.query);
    
    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      message: error.message,
    });
  }
}

const updateAgendaLink = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      linkID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      status: Joi.boolean().required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelAgenda.updateAgendaLink(req.query, req.body);

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
}

const deleteAgendaLink = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      linkID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelAgenda.deleteAgendaLink(req.query);

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
}

const getAgendaEventTypes = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelAgenda.getAgendaEventTypes(req.query);

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

const createAgendaEventType = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      duration: Joi.number().min(0).required(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelAgenda.createAgendaEventType(req.query, req.body);

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

const updateAgendaEventType = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      agendaEventTypeID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string().allow("", null),
      description: Joi.string().allow("", null),
      duration: Joi.number().min(0).allow("", null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelAgenda.updateAgendaEventType(req.query, req.body);

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

const deleteAgendaEventType = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      agendaEventTypeID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelAgenda.deleteAgendaEventType(req.query);

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

const getAgendaBlockedHours = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      accountID: Joi.string().allow("", null),
      permanent: Joi.boolean().allow("", null),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelAgenda.getAgendaBlockedHours(req.query);

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      message: error.message,
    });
  }
};

const createAgendaBlockedHours = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      accountID: Joi.string().allow("", null),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      is_global: Joi.boolean().required(),
      is_permanent: Joi.boolean().required(),
      start_time: Joi.string().pattern(timePattern).required(),
      end_time: Joi.string().pattern(timePattern).required(),
      blocked_date: Joi.date().allow(null, ""),
      blocked_days: Joi.array().items(Joi.number()).allow(null, ""),
      reason: Joi.string().allow("", null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelAgenda.createAgendaBlockedHours(req.query, req.body);
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
}

const updateAgendaBlockedHours = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      accountID: Joi.string().allow("", null),
      agendaBlockedHoursID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const bodySchema = Joi.object({
      is_global: Joi.boolean().allow("", null),
      is_permanent: Joi.boolean().allow("", null),
      start_time: Joi.string().pattern(timePattern).allow("", null),
      end_time: Joi.string().pattern(timePattern).allow("", null),
      blocked_date: Joi.date().allow(null, ""),
      blocked_days: Joi.array().items(Joi.number()).allow(null, ""),
      reason: Joi.string().allow("", null),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelAgenda.updateAgendaBlockedHours(req.query, req.body);

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
}

const deleteAgendaBlockedHours = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      agendaBlockedHoursID: Joi.string().required(),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    const response = await modelAgenda.deleteAgendaBlockedHours(req.query);

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
}

const getAgendaLogs = async (req, res) => {
  try {
    const querySchema = Joi.object({
      companyID: Joi.string().required(),
      agendaReserveID: Joi.string().allow("", null),
    });

    const { error: queryError } = querySchema.validate(req.query);
    if (queryError) {
      throw new Error(queryError.details[0].message);
    }
    
    const response = await modelAgenda.getAgendaReserveLog(req.query);

    res.status(200).json({
      code: 200,
      status: true,
      data: {
        ...response,
        data: JSON.parse(response.data),
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      message: error.message,
    });
  }
}

module.exports = {
  getAgendaReserves,
  getAgendaReservesStatus,
  createAgendaReserve,
  updateAgendaReserve,
  deleteAgendaReserve,
  getAgendaLinkDetails,
  joinAgendaLinkReserve,
  getAgendaLinksByCompany,
  createAgendaLink,
  updateAgendaLink,
  deleteAgendaLink,
  getAgendaEventTypes,
  createAgendaEventType,
  updateAgendaEventType,
  deleteAgendaEventType,
  getAgendaBlockedHours,
  createAgendaBlockedHours,
  updateAgendaBlockedHours,
  deleteAgendaBlockedHours,
  getAgendaLogs,
};