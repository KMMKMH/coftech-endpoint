const { formatFileSize } = require("../../utils/filer_size");

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInt,
} = require("graphql");

const ExportChatStatusEnum = new GraphQLEnumType({
  name: "ExportChatStatus",
  values: {
    QUEUE: { value: "QUEUE" },
    PROCESSING: { value: "PROCESSING" },
    COMPLETE: { value: "COMPLETE" },
    FAILED: { value: "FAILED" },
    CANCELLED: { value: "CANCELLED" },
  },
});

const ExportChatType = new GraphQLObjectType({
  name: "ExportChatType",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Internal incremental identifier of the export",
      resolve: (root) => root.id,
    },
    uuidUnique: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Unique UUID of the export",
      resolve: (root) => root.uuid_unique,
    },
    userId: {
      type: new GraphQLNonNull(GraphQLID),
      description: "UUID of the user who requested the export",
      resolve: (root) => root.user_id,
    },
    botId: {
      type: new GraphQLNonNull(GraphQLID),
      description: "UUID of the bot associated with the export",
      resolve: (root) => root.bot_id,
    },
    clientId: {
      type: new GraphQLNonNull(GraphQLID),
      description: "ID of the client",
      resolve: (root) => root.client_id,
    },
    botPhone: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Phone number of the bot",
      resolve: (root) => root.bot_phone,
    },
    clientPhone: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Phone number of the client",
      resolve: (root) => root.client_phone,
    },
    status: {
      type: new GraphQLNonNull(ExportChatStatusEnum),
      description: "Current status of the export",
      resolve: (root) => root.status,
    },
    fromDate: {
      type: GraphQLString,
      description: "Start date of the message range to export",
      resolve: (root) => root.from_date?.toISOString(),
    },
    toDate: {
      type: GraphQLString,
      description: "End date of the message range to export",
      resolve: (root) => root.to_date?.toISOString(),
    },
    includeMedia: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Indicates if media will be included in the export",
      resolve: (root) => root.include_media,
    },
    isFullChat: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Indicates if the full chat will be exported",
      resolve: (root) => root.is_full_chat,
    },
    presignedUrl: {
      type: GraphQLString,
      description: "Pre-signed URL to download the exported file",
      resolve: (root, args, context) => {
        if (context.user === root.user_id) return root.presigned_url;
        return null;
      },
    },
    fileSize: {
      type: GraphQLString,
      description: "Formatted size of the exported file",
      resolve: (root) => {
        if (!root.file_size) return null;
        return formatFileSize(root.file_size);
      },
    },
    totalMessages: {
      type: GraphQLInt,
      description: "Total number of exported messages",
      resolve: (root) => root.total_messages,
    },
    errorMessage: {
      type: GraphQLString,
      description: "Error message in case of failure",
      resolve: (root, args, context) => {
        if (
          ["ADMIN", "SUPERADMIN"].includes(context.rolKey) ||
          context.user === root.user_id
        )
          return root.error_message;
        return null;
      },
    },
    processedAt: {
      type: GraphQLString,
      description: "Timestamp when the export was processed",
      resolve: (root) => root.processed_at?.toISOString(),
    },
    createdAt: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Timestamp when the export was created",
      resolve: (root) => root.created_at.toISOString(),
    },
    updatedAt: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Timestamp of the last update of the export",
      resolve: (root) => root.updated_at.toISOString(),
    },
  },
});

module.exports = {
  ExportChatType,
  ExportChatStatusEnum,
};
