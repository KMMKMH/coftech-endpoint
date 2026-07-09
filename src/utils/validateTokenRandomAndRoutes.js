const db = require("../utils/db");

/**
 * Validates the token and checks if the route is allowed.
 * @returns {boolean} true if response was sent (error), false if validation passed
 */
const validateTokenRandomAndRoutes = async (req, res) => {
  try {
    const token = req.headers["coftech-x"];

    const tokenData = await db("tokens").where({ token }).first();

    if (tokenData && tokenData.status == 1) {
      let allowedEndpoints;
      try {
        allowedEndpoints = JSON.parse(tokenData.allowed_endpoints);
      } catch (error) {
        res.status(401).json({
          code: 401,
          status: false,
          message: `Unauthorized: Error parsing allowed endpoints, Error: ${error.message}`,
        });
        return true;
      }

      const currentMethod = req.method;
      const currentOriginalUrl = req.originalUrl.includes("?")
        ? req.originalUrl.split("?")[0]
        : req.originalUrl;

      if (allowedEndpoints == null) {
        res.status(401).json({
          code: 401,
          status: false,
          message: "Unauthorized: No allowed endpoints",
        });
        return true;
      }
      const isAllowed = allowedEndpoints.some((endpoint) => {
        return (
          endpoint.url == currentOriginalUrl &&
          endpoint.methods.includes(currentMethod)
        );
      });

      if (!isAllowed) {
        res.status(401).json({
          code: 401,
          status: false,
          message: `Unauthorized: Access to the route ${currentOriginalUrl} or method is not authorized`,
        });
        return true;
      }
    }
    return false;
  } catch (error) {
    res.status(401).json({
      code: 401,
      status: false,
      message: error.message,
    });
    return true;
  }
};

module.exports = validateTokenRandomAndRoutes;
