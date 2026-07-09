/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.raw(`
    UPDATE social_messages
    SET category = CASE
      WHEN BODY LIKE '%how%' OR BODY LIKE '%process%' OR BODY LIKE '%steps%' THEN 'Procedure'
      WHEN BODY LIKE '%requirements%' OR BODY LIKE '%documents%' OR BODY LIKE '%need%' OR BODY LIKE '%entrepreneurship company%' THEN 'Requirements'
      WHEN BODY LIKE '%how long%' OR BODY LIKE '%days%' OR BODY LIKE '%delay%' OR BODY LIKE '%timeline%' THEN 'Deadlines'
      WHEN BODY LIKE '%cost%' OR BODY LIKE '%money%' OR BODY LIKE '%price%' OR BODY LIKE '%amount%' THEN 'Costs'
      WHEN BODY LIKE '%course%' OR BODY LIKE '%training%' OR BODY LIKE '%class%' OR BODY LIKE '%workshop%' THEN 'Training'
      WHEN BODY LIKE '%financing%' OR BODY LIKE '%subsidy%' OR BODY LIKE '%financial aid%' OR BODY LIKE '%seed capital%' OR BODY LIKE '%loan%' OR BODY LIKE '%microfinance%' THEN 'Financial Advice'
      WHEN BODY LIKE '%available%' OR BODY LIKE '%hours%' OR BODY LIKE '%schedule%' OR BODY LIKE '%open%' THEN 'Availability'
      WHEN BODY LIKE '%register%' OR BODY LIKE '%registration%' OR BODY LIKE '%sign up%' OR BODY LIKE '%enroll%' THEN 'Registration'
      WHEN BODY LIKE '%required documents%' OR BODY LIKE '%paperwork%' OR BODY LIKE '%certificates%' OR BODY LIKE '%documentation%' OR BODY LIKE '%copies%' OR BODY LIKE '%form%' THEN 'Documentation'
      WHEN BODY LIKE '%renew%' OR BODY LIKE '%renewal%' OR BODY LIKE '%update%' THEN 'Renewal'
      WHEN BODY LIKE '%certificate%' OR BODY LIKE '%certification%' THEN 'Certifications'
      WHEN BODY LIKE '%technical problem%' OR BODY LIKE '%technical help%' OR BODY LIKE '%technical issue%' THEN 'Technical Help'
      WHEN BODY LIKE '%tracking%' OR BODY LIKE '%progress%' THEN 'Tracking'
      WHEN BODY LIKE '%online registration%' OR BODY LIKE '%internet%' OR BODY LIKE '%third party%' THEN 'Online Registration'
      WHEN BODY LIKE '%support programs%' OR BODY LIKE '%initiative%' OR BODY LIKE '%program%' OR BODY LIKE '%services%' THEN 'Support Programs'
      WHEN BODY LIKE '%question%' OR BODY LIKE '%clarification%' OR BODY LIKE '%inquiry%' OR BODY LIKE '%doubt%' THEN 'Question Resolution'
      WHEN BODY LIKE '%status%' OR BODY LIKE '%request%' OR BODY LIKE '%application%' OR BODY LIKE '%progress%' THEN 'Request Status'
      WHEN BODY LIKE '%education%' OR BODY LIKE '%academic%' THEN 'Academic Training'
      WHEN BODY LIKE '%tools%' OR BODY LIKE '%available%' THEN 'Available Tools'
      WHEN BODY LIKE '%benefit%' OR BODY LIKE '%social%' OR BODY LIKE '%subsidy%' THEN 'Social Benefits'
      WHEN BODY LIKE '%single window%' OR BODY LIKE '%one stop%' OR BODY LIKE '%single point of contact%' OR BODY LIKE '%centralized process%' THEN 'General Services'
      ELSE 'Unclassified'
    END
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex("social_messages").update({ category: "Unclassified" });
};