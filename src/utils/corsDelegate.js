require("dotenv").config();
const logger = require("./logger");

module.exports = async (req, res, next) => {
  let corsAllow = false;
  const origin = req.header("Origin");
  const realIP = req.header("x-real-ip");
  const referer = req.header("referer");
  const fetchSite = req.header("sec-fetch-site");
  const host = req.header("host");
  const userAgent = req.header("user-agent");
  const snsMessageType = req.header("x-amz-sns-message-type");


  if (req.path === '/paymentsbg') {
    if (req.method !== 'GET') {
      logger.warn('Yappy IPN: Method not allowed', {
        method: req.method,
        ip: req.ip,
        path: req.path
      });
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!req.query.orderId || !req.query.status || !req.query.hash) {
      logger.warn('Yappy IPN: Missing required parameters', {
        query: req.query,
        ip: req.ip,
        missing: {
          orderId: !req.query.orderId,
          status: !req.query.status,
          hash: !req.query.hash
        }
      });
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    logger.info('Yappy IPN allowed', {
      orderId: req.query.orderId,
      status: req.query.status,
      ip: req.ip,
      realIP,
      userAgent: req.header("User-Agent"),
      origin: req.header("Origin"),
      timestamp: new Date().toISOString()
    });

    return next();
  }

  if (req.path === '/webhooks/amazon/sns' && 
      userAgent && userAgent.includes('Amazon Simple Notification Service Agent') &&
      snsMessageType) {
    logger.info('AWS SNS webhook allowed', {
      messageType: snsMessageType,
      ip: req.ip,
      realIP,
      userAgent,
      topicArn: req.header('x-amz-sns-topic-arn'),
      messageId: req.header('x-amz-sns-message-id'),
      timestamp: new Date().toISOString()
    });
    
    return next();
  }

  const originsStrings = process.env.CORS_ORIGINS;
  const allowedOrigins = originsStrings ? originsStrings.split(",") : [];

  const allowedIPsStrings = process.env.CORS_ALLOWED_IPS;
  const allowedIPs = allowedIPsStrings ? allowedIPsStrings.split(",") : [];

  if (
    process.env.ENVIRONMENT == "development" ||  
    process.env.ENVIRONMENT == "test"  
  ) {
    corsAllow = true;
  } else if (
    (origin && origin.match(/^https?:\/\/(?:[a-zA-Z0-9-]+\.)?coftechservices\.com$/)) ||
    (origin && allowedOrigins.includes(origin)) ||
    (host &&
      host.match(/^(coftech-backend-api|coftech-backend-api-test)\.coftechservices\.com$/) &&
      referer &&
      referer === "https://accounts.google.com/" &&
      fetchSite &&
      fetchSite === "cross-site") ||
    (fetchSite && (fetchSite === "same-origin" || fetchSite === "same-site")) ||
    (realIP && allowedIPs.some(ip => realIP.includes(ip)))
  ) {
    corsAllow = true;
  }

  if (!corsAllow) {
    logger.error("No CORS allow", req.headers);
    return res.json("No CORS allow.");
  }
  next();
};
