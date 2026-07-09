const cronParser = require("cron-parser");
const dayjs = require("dayjs");
const repoCampaigns = require("../../../repositories/campaigns");

const modelCampaigns = require("../../../models/campaigns");
const logger = require("../../logger");

const campaignsCron = async () => {
  const campaignsCron = (
    await repoCampaigns.getCampaignsByField({
      "campaigns.status": "ACTIVE",
    })
  ).filter((campaign) => campaign.cron !== "" && campaign.cron !== null);

  const now = dayjs();

  for (const campaign of campaignsCron) {
    try {
      const interval = cronParser.parseExpression(campaign.cron, {
        currentDate: now.toDate(),
        tz: "America/Bogota",
      });
      const nextExecution = dayjs(interval.next().toDate());
      const prevExecution = dayjs(interval.prev().toDate());

      const { prev, next } = campaign;
      /* eslint-disable */
      switch (campaign.type) {
        case "UNIQUE":
          if (!next) {
            await repoCampaigns.updateCampaign(
              { "campaigns.uuid_unique": campaign.uuid_unique },
              { next: nextExecution.toISOString() }
            );
            break;
          }

          if (now.isAfter(next)) {
            await Promise.all([
              repoCampaigns.updateCampaign(
                { "campaigns.uuid_unique": campaign.uuid_unique },
                { prev: next, next: null, status: "IN_PROGRESS" }
              ),
              repoCampaigns.saveCampaignLog({
                company_id: campaign.company_id,
                bot_id: campaign.bot_id,
                campaign_id: campaign.uuid_unique,
                started_at: now.format("YYYY-MM-DD HH:mm"),
              }),
            ]);

            modelCampaigns.startBotCampaign({
              campaignID: campaign.uuid_unique,
            });
            return;
          }
          break;

        case "RECURRENT":
          if (!prev && !next) {
            await repoCampaigns.updateCampaign(
              { "campaigns.uuid_unique": campaign.uuid_unique },
              {
                prev: prevExecution.toISOString(),
                next: nextExecution.toISOString(),
              }
            );

            break;
          }

          if (now.isAfter(next)) {
            await Promise.all([
              repoCampaigns.updateCampaign(
                { "campaigns.uuid_unique": campaign.uuid_unique },
                {
                  prev: next,
                  next: nextExecution.toISOString(),
                  status: "IN_PROGRESS",
                }
              ),
              repoCampaigns.saveCampaignLog({
                company_id: campaign.company_id,
                bot_id: campaign.bot_id,
                campaign_id: campaign.uuid_unique,
                started_at: now.format("YYYY-MM-DD HH:mm"),
              }),
            ]);

            modelCampaigns.startBotCampaign({
              campaignID: campaign.uuid_unique,
            });
            return;
          }
          break;
      }
      /* eslint-enable */
    } catch (error) {
      logger.error(error);
    }
  }
};

module.exports = campaignsCron;
