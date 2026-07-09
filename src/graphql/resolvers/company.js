const modelCompany = require("../../models/company");

const getCompany = async (_parent, args, context) => {
  try {
    const { user } = context;
    const { id } = args;

    const companies = await modelCompany.getCompanyList({
      companyID: id,
      user,
    });

    if (!companies.length) {
      throw new Error("Company not found");
    }
    const pickedCompany = companies.map((company) => {
      return {
        id: company.uuid_unique,
        name: company.name,
        logo: company.logo,
        is_active: company.status,
        created_at: company.created_at,
        updated_at: company.updated_at,
      };
    });
    return pickedCompany;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getCompany,
};
