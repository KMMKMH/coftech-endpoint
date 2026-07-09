const headers = require("./headers");
const responses = require("./responses");
module.exports = {
  "/orders": {
    post: {
      summary: "Post orders NMI",
      tags: ["Orders/NMI"],
      parameters: [
        {
          in: "header",
          name: "X-Body-Type",
          schema: {
            type: "string",
            default: "NMI-Body-Type",
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
                event_id: {
                  type: "string",
                  description: "event ID",
                  default: "842df310-3c7d-4f76-828c-44730c3e38ee",
                },
                event_type: {
                  type: "string",
                  default: "transaction.sale.success",
                },
                event_body: {
                  type: "object",
                  properties: {
                    merchant: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          default: "1096502",
                        },
                        name: {
                          type: "string",
                          default: "Coftech bot TEST",
                        },
                      },
                    },
                    features: {
                      type: "object",
                      properties: {
                        is_test_mode: {
                          type: "boolean",
                          default: true,
                        },
                      },
                    },
                    transaction_id: {
                      type: "string",
                      default: "9716647989",
                    },
                    transaction_type: {
                      type: "string",
                      default: "cc",
                    },
                    condition: {
                      type: "string",
                      default: "pendingsettlement",
                    },
                    processor_id: {
                      type: "string",
                      default: "ccprocessora",
                    },
                    ponumber: {
                      type: "string",
                      default: "",
                    },
                    order_description: {
                      type: "string",
                      default: "Coftech Shop - Order 65",
                    },
                    order_id: {
                      type: "string",
                      default: "65",
                    },
                    customerid: {
                      type: "string",
                      default: "",
                    },
                    customertaxid: {
                      type: "string",
                      default: "",
                    },
                    website: {
                      type: "string",
                      default: "",
                    },
                    shipping: {
                      type: "string",
                      default: "",
                    },
                    currency: {
                      type: "string",
                      default: "USD",
                    },
                    tax: {
                      type: "string",
                      default: "",
                    },
                    surcharge: {
                      type: "string",
                      default: "",
                    },
                    cash_discount: {
                      type: "string",
                      default: "",
                    },
                    tip: {
                      type: "string",
                      default: "",
                    },
                    requested_amount: {
                      type: "string",
                      default: "750.00",
                    },
                    shipping_carrier: {
                      type: "string",
                      default: "",
                    },
                    tracking_number: {
                      type: "string",
                      default: "",
                    },
                    shipping_date: {
                      type: "string",
                      default: "",
                    },
                    partial_payment_id: {
                      type: "string",
                      default: "",
                    },
                    partial_payment_balance: {
                      type: "string",
                      default: "",
                    },
                    platform_id: {
                      type: "string",
                      default: "",
                    },
                    authorization_code: {
                      type: "string",
                      default: "123456",
                    },
                    social_security_number: {
                      type: "string",
                      default: "",
                    },
                    drivers_license_number: {
                      type: "string",
                      default: "",
                    },
                    drivers_license_state: {
                      type: "string",
                      default: "",
                    },
                    drivers_license_dob: {
                      type: "string",
                      default: "",
                    },
                    duty_amount: {
                      type: "string",
                      default: "0.00",
                    },
                    discount_amount: {
                      type: "string",
                      default: "0.00",
                    },
                    national_tax_amount: {
                      type: "string",
                      default: "0.00",
                    },
                    summary_commodity_code: {
                      type: "string",
                      default: "",
                    },
                    alternate_tax_amount: {
                      type: "string",
                      default: "0.00",
                    },
                    vat_tax_amount: {
                      type: "string",
                      default: "0.00",
                    },
                    vat_tax_rate: {
                      type: "string",
                      default: "0.00",
                    },
                    billing_address: {
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
                        address_1: {
                          type: "string",
                          default: "Panama",
                        },
                        address_2: {
                          type: "string",
                          default: "",
                        },
                        company: {
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
                        postal_code: {
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
                        cell_phone: {
                          type: "string",
                          default: "",
                        },
                        fax: {
                          type: "string",
                          default: "",
                        },
                      },
                    },
                    shipping_address: {
                      type: "object",
                      properties: {
                        first_name: {
                          type: "string",
                          default: "",
                        },
                        last_name: {
                          type: "string",
                          default: "",
                        },
                        address_1: {
                          type: "string",
                          default: "",
                        },
                        address_2: {
                          type: "string",
                          default: "",
                        },
                        company: {
                          type: "string",
                          default: "",
                        },
                        city: {
                          type: "string",
                          default: "",
                        },
                        state: {
                          type: "string",
                          default: "",
                        },
                        postal_code: {
                          type: "string",
                          default: "",
                        },
                        country: {
                          type: "string",
                          default: "",
                        },
                        email: {
                          type: "string",
                          default: "",
                        },
                        phone: {
                          type: "string",
                          default: "",
                        },
                        cell_phone: {
                          type: "string",
                          default: "",
                        },
                        fax: {
                          type: "string",
                          default: "",
                        },
                      },
                    },
                    card: {
                      type: "object",
                      properties: {
                        cc_number: {
                          type: "string",
                          default: "341111*****1002",
                        },
                        cc_exp: {
                          type: "string",
                          default: "0726",
                        },
                        cavv: {
                          type: "string",
                          default: "",
                        },
                        cavv_result: {
                          type: "string",
                          default: "",
                        },
                        xid: {
                          type: "string",
                          default: "",
                        },
                        eci: {
                          type: "string",
                          default: "",
                        },
                        avs_response: {
                          type: "string",
                          default: "N",
                        },
                        csc_response: {
                          type: "string",
                          default: "N",
                        },
                        cardholder_auth: {
                          type: "string",
                          default: "",
                        },
                        cc_start_date: {
                          type: "string",
                          default: "",
                        },
                        cc_issue_number: {
                          type: "string",
                          default: "",
                        },
                        card_balance: {
                          type: "string",
                          default: "",
                        },
                        card_available_balance: {
                          type: "string",
                          default: "",
                        },
                        entry_mode: {
                          type: "string",
                          default: "4",
                        },
                        cc_bin: {
                          type: "string",
                          default: "",
                        },
                        cc_type: {
                          type: "string",
                          default: "American Express",
                        },
                        feature_token: {
                          type: "string",
                          default: "",
                        },
                      },
                    },
                    merchant_defined_fields: {
                      type: "object",
                      properties: {},
                    },
                    action: {
                      type: "object",
                      properties: {
                        amount: {
                          type: "string",
                          default: "750.00",
                        },
                        action_type: {
                          type: "string",
                          default: "sale",
                        },
                        date: {
                          type: "string",
                          default: "20240713032517",
                        },
                        success: {
                          type: "string",
                          default: "1",
                        },
                        ip_address: {
                          type: "string",
                          default: "181.32.22.210",
                        },
                        source: {
                          type: "string",
                          default: "api",
                        },
                        api_method: {
                          type: "string",
                          default: "direct_post",
                        },
                        username: {
                          type: "string",
                          default: "credicorpbotai",
                        },
                        response_text: {
                          type: "string",
                          default: "SUCCESS",
                        },
                        response_code: {
                          type: "string",
                          default: "100",
                        },
                        processor_response_text: {
                          type: "string",
                          default: "",
                        },
                        top_to_mobile: {
                          type: "boolean",
                          default: false,
                        },
                        processor_response_code: {
                          type: "string",
                          default: "",
                        },
                        device_license_number: {
                          type: "string",
                          default: "",
                        },
                        device_nickname: {
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
        },
      },
    },
  },
};
