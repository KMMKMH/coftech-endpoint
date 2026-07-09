const logger = require("../utils/logger");
const db = require("../utils/db");

const getUsersByField = async (data, isRaw = false, limit = 10, page = 1) => {
  try {
    const query = db("raffle_users");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    query.limit(limit).offset((page - 1) * limit);

    const [result, totalCount] = await Promise.all([
      query,
      db("raffle_users").count("id as total").first(),
    ]);

    const totalPages = Math.ceil(totalCount.total / limit);

    return {
      result: result.length > 0 ? result : [],
      totalPages,
      currentPage: page,
      totalUsers: totalCount.total,
    };
  } catch (e) {
    logger.error(
      `Error getting raffle account with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting raffle account data`);
  }
};

const saveUser = async (data) => {
  try {
    logger.info(`Saving raffle user with data: ${JSON.stringify(data)}`);
    const [userIdField] = await db("raffle_users").insert(data);

    return userIdField
      ? (
        await getUsersByField({
          "raffle_users.id": userIdField,
        })
      )[0]
      : false;
  } catch (error) {
    logger.error(
      `Error saving user with data: ${JSON.stringify(data)}, error: ${error.message
      }`
    );
    throw new Error(error);
  }
};

const saveVerificationCode = async (data) => {
  try {
    const [raffleVerificationId] = await db("raffle_auth_codes").insert(
      data
    );

    return raffleVerificationId
      ? (
        await getVerificationCodeByField({
          "raffle_auth_codes.id": raffleVerificationId,
        })
      )[0]
      : false;
  } catch (error) {
    logger.error(
      `Error saving verification raffle user code with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    throw new Error(error);
  }
};

const getVerificationCodeByField = async (data, isRaw = false) => {
  try {
    const query = db("raffle_auth_codes");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    const result = await query;
    return result.length > 0 ? result : [];
  } catch (error) {
    logger.error(
      `Error getting raffle auth code with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    return [];
  }
};

const updateVerificationCodeStatus = async (uuid, status) => {
  try {
    return await db("raffle_auth_codes")
      .where({ uuid_unique: uuid })
      .update({ status });
  } catch (error) {
    logger.error(
      `Error updating raffle user auth code with id: ${JSON.stringify(
        uuid
      )} and status ${JSON.stringify(status)}, error: ${error.message}`
    );
  }
};

const updateVerificationCode = async (updateWhere, dataToUpdate) => {
  try {
    return await db("raffle_auth_codes")
      .where(updateWhere)
      .update(dataToUpdate);
  } catch (error) {
    logger.error(
      `Error updating raffle user auth code with data: ${JSON.stringify(
        updateWhere
      )}, error: ${error.message}`
    );
  }
};

const updateInfoLog = async (updateWhere, dataToUpdate) => {
  try {
    return await db("raffle_logs").where(updateWhere).update(dataToUpdate);
  } catch (error) {
    logger.error(
      `Error updating where: ${JSON.stringify(
        updateWhere
      )} and data ${JSON.stringify(dataToUpdate)}, error: ${error.message}`
    );
  }
};

const saveInfoLog = async (data) => {
  try {
    const [userInfoLogId] = await db("raffle_logs").insert(data);

    return userInfoLogId
      ? (
        await getVerificationCodeByField({
          "raffle_logs.id": userInfoLogId,
        })
      )[0]
      : false;
  } catch (error) {
    logger.error(
      `Error saving verification raffle info log with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    throw new Error(error);
  }
};

const getInfoLogsByField = async (data, isRaw = false) => {
  try {
    const query = db("raffle_logs");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting raffle log with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting raffle log data`);
  }
};

const updateUser = async (updateWhere, dataToUpdate) => {
  try {
    return await db("raffle_users").where(updateWhere).update(dataToUpdate);
  } catch (error) {
    logger.error(
      `Error updating where: ${JSON.stringify(
        updateWhere
      )} and data ${JSON.stringify(dataToUpdate)}, error: ${error.message}`
    );
  }
};

const getCompanyConfigsByField = async (data, isRaw = false) => {
  try {
    const query = db("raffle_company_configs");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting raffle_company_configs with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting raffle company configs data`);
  }
};

const saveCompanyConfig = async (data) => {
  try {
    logger.info(
      `Saving raffle company configs with data: ${JSON.stringify(data)}`
    );
    const [companyConfigIdField] = await db("raffle_company_configs").insert(
      data
    );

    return companyConfigIdField
      ? (
        await getCompanyConfigsByField({
          "raffle_company_configs.id": companyConfigIdField,
        })
      )[0]
      : false;
  } catch (error) {
    logger.error(
      `Error saving raffle company configs with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    throw new Error(error);
  }
};

const updateCompanyConfig = async (updateWhere, dataToUpdate) => {
  try {
    return await db("raffle_company_configs")
      .where(updateWhere)
      .update(dataToUpdate);
  } catch (error) {
    logger.error(
      `Error updating where: ${JSON.stringify(
        updateWhere
      )} and data ${JSON.stringify(dataToUpdate)}, error: ${error.message}`
    );
  }
};

const saveLottery = async (data) => {
  try {
    logger.info(`Saving raffle lottery with data: ${JSON.stringify(data)}`);
    const [lotteryField] = await db("raffle_lottery").insert(data);

    return lotteryField
      ? (
        await getLotteryByField({
          "raffle_lottery.id": lotteryField,
        })
      )[0]
      : false;
  } catch (error) {
    logger.error(
      `Error saving raffle lottery with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    throw new Error(error);
  }
};

const getLotteryByField = async (data, isRaw = false) => {
  try {
    const query = db("raffle_lottery");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting raffle lottery with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting raffle lottery data`);
  }
};

const getLotteryTypeByField = async (data, isRaw = false) => {
  try {
    const query = db("raffle_lottery_types");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting raffle lottery type with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting raffle lottery type`);
  }
};

const updateLottery = async (updateWhere, dataToUpdate) => {
  try {
    return await db("raffle_lottery")
      .where(updateWhere)
      .update(dataToUpdate);
  } catch (error) {
    logger.error(
      `Error updating where: ${JSON.stringify(
        updateWhere
      )} and data ${JSON.stringify(dataToUpdate)}, error: ${error.message}`
    );
  }
};

const deleteLottery = async (deleteWhere) => {
  try {
    return await db("raffle_lottery").where(deleteWhere).del();
  } catch (error) {
    logger.error(
      `Error deleting where: ${JSON.stringify(
        deleteWhere
      )}, error: ${JSON.stringify(error)}`
    );
  }
};

const getLotteryConfigsByField = async (data, isRaw = false) => {
  try {
    const query = db("raffle_lottery_configs");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting raffle lottery configs with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting raffle lottery configs`);
  }
};

const saveLotteryConfig = async (data) => {
  try {
    logger.info(
      `Saving raffle lottery configs with data: ${JSON.stringify(data)}`
    );
    const [lotteryConfigIdField] = await db("raffle_lottery_configs").insert(
      data
    );

    return lotteryConfigIdField
      ? (
        await getLotteryConfigsByField({
          "raffle_lottery_configs.id": lotteryConfigIdField,
        })
      )[0]
      : false;
  } catch (error) {
    logger.error(
      `Error saving raffle lottery configs with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    throw new Error(error);
  }
};

const updateLotteryConfigs = async (updateWhere, dataToUpdate) => {
  try {
    return await db("raffle_lottery_configs")
      .where(updateWhere)
      .update(dataToUpdate);
  } catch (error) {
    logger.error(
      `Error updating raffle lottery where: ${JSON.stringify(
        updateWhere
      )} and data ${JSON.stringify(dataToUpdate)}, error: ${error.message}`
    );
  }
};

const getInvoiceByField = async (data, isRaw = false, isCount = false) => {
  try {
    const query = db("raffle_invoices");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    if (isCount) {
      const result = await query
        .count("* as count")
        .sum("points as total_points");
      return result.length > 0 ? result[0] : { count: 0, total_points: 0 };
    }

    const result = await query;
    return result.length > 0 ? result : [];
  } catch (e) {
    logger.error(
      `Error getting raffle invoice with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error("Error getting raffle invoice data");
  }
};

const saveInvoice = async (data) => {
  try {
    logger.info(`Saving raffle invoice with data: ${JSON.stringify(data)}`);
    const [invoiceIdField] = await db("raffle_invoices").insert(data);

    return invoiceIdField
      ? (
        await getInvoiceByField({
          "raffle_invoices.id": invoiceIdField,
        })
      )[0]
      : false;
  } catch (error) {
    logger.error(
      `Error saving invoice with data: ${JSON.stringify(data)}, error: ${error.message
      }`
    );
    throw new Error(error);
  }
};

const updateInvoice = async (updateWhere, dataToUpdate) => {
  try {
    return await db("raffle_invoices")
      .where(updateWhere)
      .update(dataToUpdate);
  } catch (error) {
    logger.error(
      `Error updating where: ${JSON.stringify(
        updateWhere
      )} and data ${JSON.stringify(dataToUpdate)}, error: ${error.message}`
    );
  }
};

const getLotteryParticipantByField = async (data, isRaw = false) => {
  try {
    const query = db("raffle_lottery_participants");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting raffle lottery participant with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error getting raffle lottery participant data`);
  }
};

const saveLotteryParticipant = async (data) => {
  try {
    logger.info(
      `Saving raffle lottery participant with data: ${JSON.stringify(data)}`
    );
    const [lotteryParticipantIdField] = await db(
      "raffle_lottery_participants"
    ).insert(data);

    return lotteryParticipantIdField
      ? (
        await getLotteryParticipantByField({
          "raffle_lottery_participants.id": lotteryParticipantIdField,
        })
      )[0]
      : false;
  } catch (error) {
    logger.error(
      `Error saving lottery participant with data: ${JSON.stringify(
        data
      )}, error: ${error.message}`
    );
    throw new Error(error);
  }
};

const updateLotteryParticipant = async (updateWhere, dataToUpdate) => {
  try {
    return await db("raffle_lottery_participants")
      .where(updateWhere)
      .update(dataToUpdate);
  } catch (error) {
    logger.error(
      `Error updating where: ${JSON.stringify(
        updateWhere
      )} and data ${JSON.stringify(dataToUpdate)}, error: ${error.message}`
    );
  }
};

const getRoles = async (data, isRaw = false) => {
  try {
    const query = db("raffle_roles");

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting raffle roles with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting raffle roles data`);
  }
};

const getRoleByField = async (data, isRaw = false) => {
  try {
    const query = db("raffle_roles");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting raffle roles with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting raffle roles data`);
  }
};

const saveRole = async (data) => {
  try {
    logger.info(`Saving raffle role with data: ${JSON.stringify(data)}`);
    const [rolIdField] = await db("raffle_roles").insert(data);

    return rolIdField
      ? (
        await getRoleByField({
          "raffle_roles.id": rolIdField,
        })
      )[0]
      : false;
  } catch (error) {
    logger.error(
      `Error saving role with data: ${JSON.stringify(data)}, error: ${error.message
      }`
    );
    throw new Error(error);
  }
};

const deleteRole = async (deleteWhere) => {
  try {
    return await db("raffle_roles").where(deleteWhere).del();
  } catch (error) {
    logger.error(
      `Error deleting where: ${JSON.stringify(
        deleteWhere
      )}, error: ${JSON.stringify(error)}`
    );
  }
};

const updateRole = async (updateWhere, dataToUpdate) => {
  try {
    return await db("raffle_roles").where(updateWhere).update(dataToUpdate);
  } catch (error) {
    logger.error(
      `Error updating where: ${JSON.stringify(
        updateWhere
      )} and data ${JSON.stringify(dataToUpdate)}, error: ${error.message}`
    );
  }
};

const getUserRolesByField = async (data, isRaw = false) => {
  try {
    const query = db("raffle_user_roles")
      .select("raffle_user_roles.*")
      .select(
        "raffle_roles.key AS role_key",
        "raffle_roles.name AS role_name"
      )
      .leftJoin(
        "raffle_roles",
        "raffle_user_roles.role_id",
        "raffle_roles.uuid_unique"
      );

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting raffle users roles with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting raffle users roles data`);
  }
};

const saveUserRole = async (data) => {
  try {
    logger.info(
      `Saving raffle user rolee with data: ${JSON.stringify(data)}`
    );
    const [userRoleIdField] = await db("raffle_user_roles").insert(data);

    return userRoleIdField
      ? (
        await getUserRolesByField({
          "raffle_user_roles.id": userRoleIdField,
        })
      )[0]
      : false;
  } catch (error) {
    logger.error(
      `Error saving user role with data: ${JSON.stringify(data)}, error: ${error.message
      }`
    );
    throw new Error(error);
  }
};

const updateUserRole = async (updateWhere, dataToUpdate) => {
  try {
    return await db("raffle_user_roles")
      .where(updateWhere)
      .update(dataToUpdate);
  } catch (error) {
    logger.error(
      `Error updating where: ${JSON.stringify(
        updateWhere
      )} and data ${JSON.stringify(dataToUpdate)}, error: ${error.message}`
    );
  }
};

const deleteUserRole = async (deleteWhere) => {
  try {
    return await db("raffle_user_roles").where(deleteWhere).del();
  } catch (error) {
    logger.error(
      `Error deleting where: ${JSON.stringify(
        deleteWhere
      )}, error: ${JSON.stringify(error)}`
    );
  }
};

const getLotteryWinner = async () => {
  try {
    logger.info(
      `Getting lottery winner`
    );
    const query = db.raw(`
      WITH puntos_acumulados AS (
          SELECT 
              user_id,
              SUM(points) AS total_points
          FROM 
              raffle_invoices
          WHERE 
              points > 0
          GROUP BY 
              user_id
      ),
      rango_puntos AS (
          SELECT 
              user_id,
              total_points,
              SUM(total_points) OVER (ORDER BY user_id) AS cum_points
          FROM 
              puntos_acumulados
      ),
      seleccion_random AS (
          SELECT 
              user_id,
              total_points,
              cum_points,
              LAG(cum_points, 1, 0) OVER (ORDER BY user_id) + 1 AS range_start
          FROM 
              rango_puntos
      ),
      random_value AS (
          SELECT 
              FLOOR(1 + RAND() * (SELECT MAX(cum_points) FROM seleccion_random)) AS r
      )
      SELECT 
          invoices.user_id,
          invoices.company_id,
          invoices.points,
          invoices.image,
          invoices.metadata,
          lo.data AS user_data
      FROM 
          seleccion_random sr
      JOIN 
          raffle_invoices invoices ON sr.user_id = invoices.user_id
      LEFT JOIN 
          raffle_users tu ON sr.user_id = tu.uuid_unique
      LEFT JOIN 
          raffle_logs lo ON tu.phone = lo.reference AND lo.key = 'USER_DATA_PROFILE'
      JOIN 
          random_value rv ON rv.r BETWEEN sr.range_start AND sr.cum_points
      WHERE 
          invoices.points > 0
      ORDER BY 
          RAND()
      LIMIT 1;
    `);

    return query
      .then((result) => {
        return result[0].length > 0 ? result[0] : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting lottery winner, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error getting lottery winner data`);
  }
};

module.exports = {
  updateVerificationCodeStatus,
  getUsersByField,
  saveUser,
  saveVerificationCode,
  getVerificationCodeByField,
  updateUser,
  saveCompanyConfig,
  updateCompanyConfig,
  getCompanyConfigsByField,
  saveLottery,
  updateLottery,
  deleteLottery,
  getLotteryTypeByField,
  getLotteryByField,
  getInvoiceByField,
  saveInvoice,
  getLotteryParticipantByField,
  saveLotteryParticipant,
  updateLotteryParticipant,
  getLotteryConfigsByField,
  saveLotteryConfig,
  updateLotteryConfigs,
  updateInvoice,
  getRoles,
  getRoleByField,
  saveRole,
  deleteRole,
  updateRole,
  getUserRolesByField,
  saveUserRole,
  updateUserRole,
  deleteUserRole,
  getInfoLogsByField,
  updateInfoLog,
  saveInfoLog,
  updateVerificationCode,
  getLotteryWinner,
};
