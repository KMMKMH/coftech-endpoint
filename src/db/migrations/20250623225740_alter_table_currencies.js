const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "currencies";
const currenciesToInsert = [
  {
    name: "US Dollar",
    code: "USD",
    symbol: "$",
    display_symbol: "US$",
    sort_order: 1,
  },
  {
    name: "Euro",
    code: "EUR",
    symbol: "€",
    display_symbol: "€",
    sort_order: 2,
  },
  {
    name: "Pound Sterling",
    code: "GBP",
    symbol: "£",
    display_symbol: "£",
    sort_order: 3,
  },
  {
    name: "Nihon en",
    code: "JPY",
    symbol: "¥",
    display_symbol: "JP¥",
    sort_order: 4,
  },
  {
    name: "Canadian Dollar",
    code: "CAD",
    symbol: "$",
    display_symbol: "CA$",
    sort_order: 5,
  },
  {
    name: "Schweizer Franken",
    code: "CHF",
    symbol: "CHF",
    display_symbol: "CHF",
    sort_order: 6,
  },
  {
    name: "Australian Dollar",
    code: "AUD",
    symbol: "$",
    display_symbol: "AU$",
    sort_order: 7,
  },
  {
    name: "Renminbi",
    code: "CNY",
    symbol: "¥",
    display_symbol: "CN¥",
    sort_order: 8,
  },
  {
    name: "Peso mexicano",
    code: "MXN",
    symbol: "$",
    display_symbol: "MX$",
    sort_order: 9,
  },
  {
    name: "Colombian Peso",
    code: "COP",
    symbol: "$",
    display_symbol: "COL$",
    sort_order: 10,
  },
  {
    name: "Brazilian Real",
    code: "BRL",
    symbol: "R$",
    display_symbol: "R$",
    sort_order: 11,
  },
  {
    name: "Venezuelan Bolivar",
    code: "VES",
    symbol: "Bs.",
    display_symbol: "Bs.",
    sort_order: 12,
  },
  {
    name: "Argentine Peso",
    code: "ARS",
    symbol: "$",
    display_symbol: "AR$",
    sort_order: 13,
  },
  {
    name: "Peruvian Sol",
    code: "PEN",
    symbol: "S/",
    display_symbol: "S/",
    sort_order: 14,
  },
  {
    name: "Paraguayan Guarani",
    code: "PYG",
    symbol: "Gs.",
    display_symbol: "Gs.",
    sort_order: 15,
  },
  {
    name: "Chilean Peso",
    code: "CLP",
    symbol: "$",
    display_symbol: "CLP$",
    sort_order: 16,
  },
  {
    name: "Peso uruguayo",
    code: "UYU",
    symbol: "$",
    display_symbol: "UY$",
    sort_order: 17,
  },
  {
    name: "Singapore Dollar",
    code: "SGD",
    symbol: "$",
    display_symbol: "SG$",
    sort_order: 18,
  },
  {
    name: "Bhartiya Rupaya",
    code: "INR",
    symbol: "₹",
    display_symbol: "₹",
    sort_order: 19,
  },
  {
    name: "South African Rand",
    code: "ZAR",
    symbol: "R",
    display_symbol: "R",
    sort_order: 20,
  },
];

async function foreignKeyExists(knex, tableName, constraintName) {
  const result = await knex.raw(
    `
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ? 
        AND CONSTRAINT_NAME = ?
      `,
    [tableName, constraintName]
  );

  return result[0].length > 0;
}

/**
 * @param { import("knex").Knex } knex
 */
exports.up = async function (knex) {
  const paymentsFK = await foreignKeyExists(
    knex,
    "payments",
    "payments_currency_foreign"
  );
  if (paymentsFK) {
    await knex.schema.alterTable("payments", (table) => {
      table.dropForeign("currency");
    });
  }

  const storeItemsFK = await foreignKeyExists(
    knex,
    "store_items",
    "store_items_currency_id_foreign"
  );

  if (storeItemsFK) {
    await knex.schema.alterTable("store_items", (table) => {
      table.dropForeign("currency_id");
    });
  }

  await knex.schema.alterTable("payments", (table) => {
    table.string("currency").nullable().alter();
  });

  await knex.schema.alterTable("store_items", (table) => {
    table.string("currency_id").nullable().alter();
  });

  await knex("payments").whereNotNull("currency").update({ currency: null });

  await knex("store_items")
    .whereNotNull("currency_id")
    .update({ currency_id: null });

  await knex.schema.dropTableIfExists("currencies");

  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("name", 100).notNullable();
    table.string("code", 3).notNullable().unique();
    table.string("symbol", 10).notNullable();
    table.string("display_symbol", 10).notNullable();
    table.integer("sort_order").notNullable().defaultTo(999);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);

    table.index("code");
    table.index("is_active");
    table.index("sort_order");
  });

  await knex.raw(up(tableName));

  await knex("currencies").insert(
    currenciesToInsert.map((currency) => ({
      name: currency.name,
      code: currency.code,
      symbol: currency.symbol,
      display_symbol: currency.display_symbol,
      sort_order: currency.sort_order,
      is_active: true,
    }))
  );

  await knex.raw(`
      ALTER TABLE payments
      ADD CONSTRAINT payments_currency_foreign
      FOREIGN KEY (currency) REFERENCES currencies(uuid_unique)
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);

  await knex.raw(`
      ALTER TABLE store_items
      ADD CONSTRAINT store_items_currency_id_foreign
      FOREIGN KEY (currency_id) REFERENCES currencies(uuid_unique)
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function (knex) {
  const paymentsFK = await knex.raw(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'payments' 
        AND CONSTRAINT_NAME = 'payments_currency_foreign'
    `);

  if (paymentsFK[0].length) {
    await knex.schema.alterTable("payments", (table) => {
      table.dropForeign("currency");
    });
  }

  const storeItemsFK = await knex.raw(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'store_items' 
        AND CONSTRAINT_NAME = 'store_items_currency_id_foreign'
    `);

  if (storeItemsFK[0].length) {
    await knex.schema.alterTable("store_items", (table) => {
      table.dropForeign("currency_id");
    });
  }

  await knex("payments").update({ currency: null });
  await knex("store_items").update({ currency_id: null });

  await knex.schema.dropTableIfExists("currencies");

  await knex.schema.createTable("currencies", (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("name", 100).notNullable();
    table.string("code", 3).notNullable().unique();
    table.string("symbol", 10).notNullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);

    table.index("code");
    table.index("is_active");
  });

  await knex.raw(down(tableName));

  await knex("currencies").insert([
    {
      name: "United States Dollar",
      code: "USD",
      symbol: "$",
      is_active: true,
    },
    {
      name: "Euro",
      code: "EUR",
      symbol: "€",
      is_active: true,
    },
  ]);
};
