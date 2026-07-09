const headers = require("./headers");
const responses = require("./responses");
module.exports = {
  "/orders": {
    post: {
      summary: "Post orders Woo",
      tags: ["Orders/Woo"],
      parameters: [
        {
          in: "header",
          name: "X-Body-Type",
          schema: {
            type: "string",
            default: "Woo-Body-Type",
          },
          required: true,
          description: "Custom header to specify the body type",
        },
        headers
      ],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: {
                  type: "number",
                  default: "85",
                },
                parent_id: {
                  type: "number",
                  default: 0,
                },
                status: {
                  type: "string",
                  default: "processing",
                },
                currency: {
                  type: "string",
                  default: "USD",
                },
                version: {
                  type: "string",
                  default: "9.1.2",
                },
                prices_include_tax: {
                  type: "boolean",
                  default: false,
                },
                date_created: {
                  type: "string",
                  default: "2024-07-12T22:12:06",
                },
                date_modified: {
                  type: "string",
                  default: "2024-07-12T22:25:19",
                },
                discount_total: {
                  type: "string",
                  default: "0.00",
                },
                discount_tax: {
                  type: "string",
                  default: "0.00",
                },
                shipping_total: {
                  type: "string",
                  default: "0.00",
                },
                shipping_tax: {
                  type: "string",
                  default: "0.00",
                },
                cart_tax: {
                  type: "string",
                  default: "0.00",
                },
                total: {
                  type: "string",
                  default: "750.00",
                },
                total_tax: {
                  type: "string",
                  default: "0.00",
                },
                customer_id: {
                  type: "number",
                  default: 0,
                },
                order_key: {
                  type: "string",
                  default: "wc_order_CPaa6KsNErFCG",
                },
                billing: {
                  type: "object",
                  properties: {
                    first_name: {
                      type: "string",
                      default: "Alejandro",
                    },
                    last_name: {
                      type: "string",
                      default: "Moreno",
                    },
                    company: {
                      type: "string",
                      default: "",
                    },
                    address_1: {
                      type: "string",
                      default: "Panama",
                    },
                    address_2: {
                      type: "string",
                      default: "",
                    },
                    city: {
                      type: "string",
                      default: "Panama",
                    },
                    state: {
                      type: "string",
                      default: "PA-8",
                    },
                    postcode: {
                      type: "string",
                      default: "1010",
                    },
                    country: {
                      type: "string",
                      default: "PA",
                    },
                    email: {
                      type: "string",
                      default: "fixcore21@gmail.com",
                    },
                    phone: {
                      type: "string",
                      default: "",
                    },
                  },
                },
                shipping: {
                  type: "object",
                  properties: {
                    first_name: {
                      type: "string",
                      default: "Alejandro",
                    },
                    last_name: {
                      type: "string",
                      default: "Moreno",
                    },
                    company: {
                      type: "string",
                      default: "",
                    },
                    address_1: {
                      type: "string",
                      default: "Panama",
                    },
                    address_2: {
                      type: "string",
                      default: "",
                    },
                    city: {
                      type: "string",
                      default: "Panama",
                    },
                    state: {
                      type: "string",
                      default: "PA-8",
                    },
                    postcode: {
                      type: "string",
                      default: "1010",
                    },
                    country: {
                      type: "string",
                      default: "PA",
                    },
                    phone: {
                      type: "string",
                      default: "",
                    },
                  },
                },
                payment_method: {
                  type: "string",
                  default: "nmi",
                },
                payment_method_title: {
                  type: "string",
                  default: "Credit card (NMI)",
                },
                transaction_id: {
                  type: "string",
                  default: "9716647989",
                },
                customer_id_address: {
                  type: "string",
                  default: "181.32.22.210",
                },
                customer_user_agent: {
                  type: "string",
                  default:
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
                },
                created_via: {
                  type: "string",
                  default: "store-api",
                },
                customer_note: {
                  type: "string",
                  default: "",
                },
                date_completed: {
                  type: ["string", "null"],
                  default: "",
                },
                date_paid: {
                  type: "string",
                  default: "2024-07-12T22:25:19",
                },
                cart_hash: {
                  type: "string",
                  default: "88d6e4bdb9283ea18131eacdbb9b6f00",
                },
                number: {
                  type: "string",
                  default: "65",
                },
                meta_data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "number",
                      },
                      key: {
                        type: "string",
                      },
                      value: {
                        type: "string",
                      },
                    },
                    required: ["id", "key", "value"],
                  },
                  example: [
                    {
                      id: 24,
                      key: "_coupons_hash",
                      value: "d751713988987e9331980363e24189ce",
                    },
                  ],
                },
                line_items: {
                  type: "array",
                  items: [
                    {
                      id: {
                        type: "number",
                        default: 2,
                      },
                      name: {
                        type: "string",
                        default: "Bot Base",
                      },
                      product_id: {
                        type: "number",
                        default: 14,
                      },
                      variation_id: {
                        type: "number",
                        default: 0,
                      },
                      quantity: {
                        type: "number",
                        default: 1,
                      },
                      tax_class: {
                        type: "string",
                        default: "",
                      },
                      subtotal: {
                        type: "string",
                        default: "750.00",
                      },
                      subtotal_tax: {
                        type: "string",
                        default: "0.00",
                      },
                      total: {
                        type: "string",
                        default: "750.00",
                      },
                      taxes: {
                        type: "array",
                      },
                      meta_data: {
                        type: "array",
                      },
                      sku: {
                        type: "string",
                        default: "bot_base",
                      },
                      price: {
                        type: "number",
                        default: 750,
                      },
                      image: {
                        type: "object",
                        properties: {
                          id: {
                            type: "string",
                          },
                          src: {
                            type: "string",
                          },
                        },
                      },
                      parent_name: {
                        type: ["string", "null"],
                        default: null,
                      },
                    },
                  ],
                },
                tax_lines: {
                  type: "array",
                },
                shipping_lines: {
                  type: "array",
                },
                fee_lines: {
                  type: "array",
                },
                coupon_lines: {
                  type: "array",
                },
                refunds: {
                  type: "array",
                },
                payments_url: {
                  type: "string",
                  default:
                    "https://shop.coftechservices.com/checkout/order-pay/65/?pay_for_order=true&key=wc_order_CPaa6KsNErFCG",
                },
                is_editable: {
                  type: "boolean",
                  default: false,
                },
                needs_payment: {
                  type: "boolean",
                  default: false,
                },
                needs_processing: {
                  type: "boolean",
                  default: true,
                },
                date_created_gmt: {
                  type: ["string", "null"],
                  default: "2024-07-13T03:12:06",
                },
                date_modified_gmt: {
                  type: ["string", "null"],
                  default: "2024-07-13T03:25:19",
                },
                date_completed_gmt: {
                  type: ["string", "null"],
                  default: null,
                },
                date_paid_gmt: {
                  type: "string",
                  default: "2024-07-13T03:25:19",
                },
                currency_symbol: {
                  type: "string",
                  default: "$",
                },
                _link: {
                  type: "string",
                  default: "",
                },
              },
            },
          },
        },
      },
    },
  },
};
