require("dotenv").config();

const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const { getTokenByField } = require("../repositories/utils");
const { generateJWT } = require("../utils/generateJWT");

const repoAccounts = require("../repositories/accounts");
const validateTokenRandomAndRoutes = require("../utils/validateTokenRandomAndRoutes");

const main = async (req, res, next) => {
  try {
    const { url } = req;
    const userAgent = req.headers["user-agent"];

    const coftech_x_header = req.headers["coftech-x"];

    if (coftech_x_header && coftech_x_header != "") {
      const [tokenField] = await getTokenByField({
        token: coftech_x_header,
      });

      if (!tokenField || !tokenField.status) {
        throw new Error("Invalid header token");
      }

      const [role] = await repoAccounts.getRolesByField({
        "roles.key": "SUPERADMIN",
      });

      const [accountField] = await repoAccounts.getAccountByField({
        "account_role.role_id": role.uuid_unique,
      });

      if (!accountField) {
        throw new Error("Invalid header token");
      }

      if (accountField) {
        const validationResult = await validateTokenRandomAndRoutes(req, res);
        if (validationResult) {
          return;
        }
      }

      const temporalToken = generateJWT(
        "CoftechDashboard",
        {
          user: accountField.uuid_unique,
        },
        process.env.JWT_SECRET
      );

      const temporalUniqueToken = await jwt.verify(
        temporalToken,
        process.env.JWT_SECRET
      );

      req.unique_token = temporalUniqueToken;
      return next();
    }

    const isTestEnvironment =
      process.env.ENVIRONMENT == "development" ||
      process.env.ENVIRONMENT == "test"
        ? true
        : false;

    if (isTestEnvironment) {
      console.log("Request START ---");
      console.log("userAgent", userAgent);
      console.log("url", url);
      console.log("Request END ---");
    }

    if (
      url == "/auth/login" ||
      url == "/auth/recovery/password" ||
      url == "/auth/verify/code" ||
      url.includes("/raffle/auth/resend-code") ||
      url.includes("/raffle/auth/verify-code") ||
      url.includes("/raffle/auth/verification") ||
      url.includes("/google/auth/callback") ||
      url.includes("/webhooks/amazon/sns") ||
      url.includes("/webhooks/meta") ||
      url.includes("/paymentsbg") ||
      (isTestEnvironment && url.includes("/graphql"))
    ) {
      return next();
    }

    if (!req.headers.authorization) {
      return res.status(401).json({
        code: 401,
        status: false,
        message: "Token authentication required",
      });
    }

    const token = req.headers.authorization.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({
        code: 401,
        status: false,
        message: "Bearer token not found.",
      });
    }

    if (url.includes("/raffle/user")) {
      const dataToken = await jwt.verify(
        token,
        process.env.JWT_RAFFLE_SECRET
      );
      req.unique_token = dataToken;

      return next();
    }

    const dataToken = await jwt.verify(token, process.env.JWT_SECRET);
    req.unique_token = dataToken;

    next();
  } catch (e) {
    console.log(e);
    logger.error("Unauthorized request");
    res.status(401).json({
      code: 401,
      status: false,
      message: "Unauthorized request",
    });
  }
};

module.exports = main;
