const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLList,
  GraphQLID,
  GraphQLInterfaceType,
  GraphQLBoolean,
} = require("graphql");

const { formatFileSize } = require("../../utils/filer_size")

const { getMessageByContactResolver } = require("../resolvers/social");

const MetadataInterface = new GraphQLInterfaceType({
  name: "MetadataInterface",
  fields: {
    metadata_type: { type: GraphQLString },
  },
  resolveType: (value) => {
    /* eslint-disable */
    switch (value.metadata_type) {
      case "audio":
      case "image":
      case "video":
      case "document":
      case "sticker":
        return "MediaJsonType";
      case "location":
        return "LocationJsonType";
      case "contact":
        return "ContactJsonType";
      case "event_message":
        return "EventJsonType";
      default:
        return null;
    }
    /* eslint-enable */
  },
});

const MediaJsonType = new GraphQLObjectType({
  name: "MediaJsonType",
  interfaces: [MetadataInterface],
  fields: {
    metadata_type: { type: GraphQLString },
    filename: { type: GraphQLString },
    filesize: { type: GraphQLString, resolve: (root) => formatFileSize(root.filesize)},
    mimetype: { type: GraphQLString },
  },
});

const LocationJsonType = new GraphQLObjectType({
  name: "LocationJsonType",
  interfaces: [MetadataInterface],
  fields: {
    metadata_type: { type: GraphQLString },
    latitude: { type: GraphQLString },
    longitude: { type: GraphQLString },
    name: { type: GraphQLString },
    url: { type: GraphQLString },
    description: { type: GraphQLString },
  },
});

const ContactJsonType = new GraphQLObjectType({
  name: "ContactJsonType",
  interfaces: [MetadataInterface],
  fields: {
    metadata_type: { type: GraphQLString },
    fullName: { type: GraphQLString },
    phoneInternational: { type: GraphQLString },
    phoneType: { type: GraphQLString },
    phoneWaid: { type: GraphQLString },
  },
});

const EventJsonType = new GraphQLObjectType({
  name: "EventJsonType",
  interfaces: [MetadataInterface],
  fields: {
    metadata_type: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    start: { type: GraphQLString },
    end: { type: GraphQLString },
    link: { type: GraphQLString },
    location: { type: GraphQLString },
  },
});

const MessageType = new GraphQLObjectType({
  name: "MessageType",
  fields: () => ({
    message_id: { type: GraphQLID },
    sender_number: { type: GraphQLString },
    sender_picture: { type: GraphQLString },
    to_send: { type: GraphQLString },
    to_send_picture: { type: GraphQLString },
    created_at: { type: GraphQLString },
    via: { type: GraphQLString },
    is_edited: { type: GraphQLBoolean },
    is_revoked: { type: GraphQLBoolean },
    type: { type: GraphQLString },
    body: { type: GraphQLString },
    caption: { type: GraphQLString },
    quoted_message_id: { type: GraphQLString },
    metadata: {
      type: MetadataInterface,
      resolve: (message) => {
        try {
          const metadata =
            typeof message.metadata === "string"
              ? JSON.parse(message.metadata)
              : message.metadata;

          if (metadata && !metadata.metadata_type && message.type) {
            metadata.metadata_type = message.type;
          }

          return metadata;
        } catch {
          return null;
        }
      },
    },
  }),
});

const AssignedUserType = new GraphQLObjectType({
  name: "AssignedUserType",
  fields: {
    id: {
      type: GraphQLID,
      description: "Unique identifier for the assigned user (UUID)",
    },
    first_name: {
      type: GraphQLString,
      description: "First name of the user assigned",
    },
    last_name: {
      type: GraphQLString,
      description: "Last name of the user assigned",
    },
    photo: {
      type: GraphQLString,
      description: "Photo in base64 of the user assigned",
    },
    assigned_at: {
      type: GraphQLString,
      description: "Timestamp when the user was assigned",
      resolve: (root) =>
        root.assigned_at ? root.assigned_at.toISOString() : null,
    },
  },
});

const MessagesPaginatedType = new GraphQLObjectType({
  name: "MessagesPaginatedType",
  fields: {
    items: {
      type: new GraphQLList(MessageType),
      description: "List of messages",
    },
    totalPages: {
      type: GraphQLInt,
      description: "Total number of pages",
    },
    currentPage: {
      type: GraphQLInt,
      description: "Current page number",
    },
    totalMessages: {
      type: GraphQLInt,
      description: "Total number of messages",
    },
  },
});

const ContactType = new GraphQLObjectType({
  name: "ContactType",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Unique identifier for Contact (UUID)",
    },
    phone: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Phone number of the contact",
    },
    name: {
      type: GraphQLString,
      description: "Name of the contact",
    },
    photo: {
      type: GraphQLString,
      description: "Photo in base64 of the contact",
    },
    networkID: {
      type: GraphQLString,
      description: "Network identifier for the social contact",
    },
    assigned_user: {
      type: AssignedUserType,
      description: "Assigned user for the contact from the dashboard",
    },
    isBlocked: {
      type: GraphQLBoolean,
      description: "Indicates if the contact is on the blacklist",
    },
    created_at: {
      type: GraphQLString,
      description: "Timestamp when the contact was created",
    },
    updated_at: {
      type: GraphQLString,
      description: "Timestamp when the contact was last updated",
    },
    messages: {
      type: MessagesPaginatedType,
      description: "Paginated list of messages for the contact",
      args: {
        limit: {
          type: GraphQLInt,
          defaultValue: 10,
          description: "Number of messages per page",
        },
        page: {
          type: GraphQLInt,
          defaultValue: 1,
          description: "Page number to fetch",
        },
        orderDirection: {
          type: GraphQLString,
          defaultValue: "DESC",
          description: "Order direction for messages (ASC or DESC)",
        },
      },
      resolve: getMessageByContactResolver,
    },
  },
});

const ContactPaginatedType = new GraphQLObjectType({
  name: "ContactPaginatedType",
  fields: {
    items: {
      type: new GraphQLList(ContactType),
      description: "List of contacts",
    },
    totalPages: {
      type: GraphQLInt,
      description: "Total number of pages",
    },
    currentPage: {
      type: GraphQLInt,
      description: "Current page number",
    },
    totalContacts: {
      type: GraphQLInt,
      description: "Total number of contacts",
    },
  },
});

const lastContactType = new GraphQLObjectType({
  name: "lastContactType",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Unique identifier for Contact (UUID)",
    },
    phone: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Phone number of the contact",
    },
    name: {
      type: GraphQLString,
      description: "Name of the contact",
    },
    photo: {
      type: GraphQLString,
      description: "Photo in base64 of the contact",
    },
    metadata: {
      type: GraphQLString,
      description: "Metadata of the contact as a JSON string",
      resolve: (root) => JSON.stringify(root.metadata),
    },
  },
});

module.exports = {
  MessageType,
  MetadataInterface,
  MediaJsonType,
  LocationJsonType,
  ContactJsonType,
  EventJsonType,
  MessagesPaginatedType,
  ContactType,
  ContactPaginatedType,
  lastContactType,
};
