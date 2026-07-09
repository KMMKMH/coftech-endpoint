const repoUtils = require("../repositories/utils");
const { getCountries } = require("countries-data-kit");

async function retrieveCountryCurrencies() {
  try {
    const countriesData = await repoUtils.getCountriesByField({});
    if (!countriesData.length) {
      throw new Error("No countries found");
    }

    const countryToCurrecy = getCountries({
      fields: ["alpha3Code", "currencyCode", "currencySymbol", "currency"],
    });

    return countriesData.reduce((acc, country) => {
      const currency = countryToCurrecy.find(
        (countryCurrency) => country.iso_alpha_3 === countryCurrency.alpha3Code
      );
      if (currency) {
        acc.push({
          name: currency.currency,
          code: currency.currencyCode,
          symbol: currency.currencySymbol,
          country_id: country.uuid_unique,
        });
      }
      return acc;
    }, []);
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = { retrieveCountryCurrencies };
