const modelAgenda = require("../../models/agenda");

const getAgendaReserves = async (parent, args, context) => {
  try {
    const { 
      companyID,
      event_type_id,
      status_id,
      date,
    } = { ...context, ...args, ...parent };

    const searchParams = { companyID, event_type_id, status_id, date };
    
    const reserves = await modelAgenda.getAgendaReserves(searchParams);

    return reserves.map((reserve) => {
      return {
        id: reserve.uuid_unique,
        name: reserve.name,
        status_id: reserve.status_id,
        event_type_id: reserve.event_type_id,
        date: reserve.date,
        phone_numbers: reserve.phone_numbers,
        companyID: reserve.company_id,
        public_notes: reserve.public_notes,
        private_notes: reserve.private_notes,
        created_at: reserve.created_at,
        updated_at: reserve.updated_at,
      };
    });
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getAgendaReserves,
};