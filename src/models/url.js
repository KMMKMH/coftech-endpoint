const dayjs = require("dayjs");
const generateToken = require("../utils/generateRandomToken");
const repoCompany = require("../repositories/company");
const { repoUrl } = require("../repositories/url");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");

const saveUrl = async (params, data) => {
  const { companyID } = params;

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });

  if (!companyField) {
    throw ApiError(404, "Company not found", ErrorCodes.COMPANY_NOT_FOUND, {
      companyID,
    });
  }

  const { time, attempts, url } = data;
  const key = generateToken(6);

  const response = await repoUrl.saveUrl({
    "short_url.time": time,
    "short_url.attempts": attempts,
    "short_url.original_url": url,
    "short_url.key": key,
    "short_url.company_id": companyID,
    "short_url.generated_url": `https://short.coftechservices.com/${key}`,
    "short_url.expiration_time":
      time > 0
        ? dayjs().add(time, "minute").format("YYYY-MM-DD HH:mm:ss")
        : null,
  });

  return response;
};

const getUrl = async (data) => {
  const { key } = data;

  const [urlField] = await repoUrl.getByField({
    "short_url.key": key,
  });

  if (!urlField) {
    throw ApiError(404, "Url not found", ErrorCodes.URL_NOT_FOUND, { key });
  }

  const { time, attempts, status, expiration_time } = urlField;

  const now = dayjs();
  const expirationTime = dayjs(expiration_time);

  if (time !== 0 && expiration_time !== null && now.isAfter(expirationTime)) {
    if (status === true) {
      await updateUrl({ key }, { "short_url.status": false });
    }

    throw ApiError(410, "Url expired", ErrorCodes.URL_EXPIRED, { key });
  }

  if (attempts !== 0) {
    if (attempts - 1 === 0 && status === false) {
      throw ApiError(
        410,
        "Url attempts Exhausted",
        ErrorCodes.URL_ATTEMPTS_EXHAUSTED,
        { key }
      );
    }

    await updateUrl(
      { key },
      attempts - 1 === 0
        ? { "short_url.status": false }
        : { "short_url.attempts": attempts - 1 }
    );
  }

  return urlField;
};

const listUrl = async (data) => {
  const { companyID } = data;

  const response = await repoUrl.getByField({
    "short_url.company_id": companyID,
  });

  return response;
};

const updateUrl = async (query, data) => {
  const { key } = query;

  const [urlField] = await repoUrl.getByField({
    "short_url.key": key,
  });

  if (!urlField) {
    throw ApiError(404, "Url not found", ErrorCodes.URL_NOT_FOUND, { key });
  }

  const response = await repoUrl.updateUrl(
    { "short_url.key": key },
    { ...data }
  );

  return response;
};

module.exports = {
  saveUrl,
  getUrl,
  listUrl,
  updateUrl,
};
