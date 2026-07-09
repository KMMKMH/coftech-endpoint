const axios = require('axios');

const getOrganizationCosts = async (key, params = {}) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };

  try {
    let nextPage = null;
    let totalAmount = 0;

    const baseUrl = "https://api.openai.com/v1/organization/costs?";

    const baseParams = {
      start_time: params.start_time,
      ...(params.end_time && { end_time: params.end_time }),
    };

    do {
      const queryParams = new URLSearchParams({
        ...baseParams,
        ...(nextPage && { page: nextPage }),
      });

      const url = baseUrl + queryParams.toString();
      const response = await axios.get(url, { headers });

      for (const bucket of response.data.data) {
        for (const result of bucket.results) {
          totalAmount += result.amount.value;
        }
      }

      nextPage = response.data.next_page;
    } while (nextPage);

    return { total_amount: totalAmount, currency: "USD" };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    throw new Error(`Failed to get organization costs: ${errorMessage}`);
  }
};

module.exports = {
  getOrganizationCosts,
};