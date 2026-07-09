const { default: axios } = require("axios");
const { XMLParser, XMLValidator } = require("fast-xml-parser");

const requestNMI = async (data, method, path = null) => {
  try {
    const nmiUrl = process.env.NMI_URL;  
    const response = await axios.request({
      method,
      url: `${path ? `${nmiUrl}/${path}` : nmiUrl}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data,
    });
    const isXMLValid = XMLValidator.validate(response.data);
    if (typeof isXMLValid === "object") {
      return parseQueryString(response.data);
    } else {
      return new XMLParser().parse(response.data);
    }
  } catch (error) {
    throw new Error(error);
  }
};

function parseQueryString(query) {
  const params = new URLSearchParams(query);
  const result = {};
  for (const [key, value] of params.entries()) {
    result[key] = value || null;
  }
  return result;
}

module.exports = { requestNMI };
