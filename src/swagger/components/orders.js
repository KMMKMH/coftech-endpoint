const nmiSchema = {
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
};
const wooSchema = {
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
};
module.exports = {
  nmiSchema,
  wooSchema,
};
