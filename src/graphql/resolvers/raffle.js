const repoRaffle = require("../../repositories/raffle");

const getRaffleUser = async (parent, args) => {
  try {
    const { phone, limit, page } = args;

    const data = {
      ...(phone && { "raffle_users.phone": phone }),
    };

    const { result, currentPage, totalPages, totalUsers } =
      await repoRaffle.getUsersByField(data, false, limit, page);

    const pickedUsers = result.map((user) => {
      return {
        id: user.uuid_unique,
        phone: user.phone,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    });
    return {
      items: pickedUsers,
      totalPages,
      currentPage,
      totalUsers,
    };
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getRaffleUser,
};
