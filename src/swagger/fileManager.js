const headers = require("./headers");
const responses = require("./responses");

module.exports = {
  "/filemanager/filetypes": {
    get: {
      summary: "List File Types",
      tags: ["FileManager"],
      parameters: [{
        name: "ragCompatible",
        in: "query",
        required: false,
        description: "Filter by RAG compatibility (true/false)",
        schema: {
          type: "string",
          enum: ["true", "false"]
        }
      },headers],
      responses,
    },
  },
  "/filemanager": {
    get: {
      summary: "List Files by company",
      tags: ["FileManager"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "fileID",
          in: "query",
          allowEmptyValue: true,
          description: "file ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "source",
          in: "query",
          description: "source name",
          schema: {
            type: "string",
            enum: ["filemanager", "rag", "desk"],
          },
        },
        {
          name: "botID",
          in: "query",
          description: "bot ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "extensions",
          in: "query",
          description: "Array of file extensions to filter by",
          schema: {
            type: "array",
            items: {
              type: "string"
            }
          },
          style: "form",
          explode: true
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Upload a file",
      tags: ["FileManager"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "folderID",
          in: "query",
          allowEmptyValue: true,
          description: "folders ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "source",
          in: "query",
          allowEmptyValue: true,
          description: "source name",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: {
                  type: "string",
                  format: "binary",
                },
              },
            },
          },
        },
      },
      responses,
    },
    put: {
      summary: "Update a File by company",
      tags: ["FileManager"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "fileID",
          in: "query",
          required: true,
          description: "File uuid unique",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Name",
                  default: "Menu coftech",
                },
                description: {
                  type: "string",
                  description: "Description of the file",
                  default: "A menu about creeps...",
                },
              },
            },
          },
        },
      },
      responses,
    },
    delete: {
      summary: "Delete a File by company",
      tags: ["FileManager"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "fileID",
          in: "query",
          required: true,
          description: "File uuid unique",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/filemanager/folders": {
    get: {
      summary: "get folders list",
      tags: ["FileManager"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "folderID",
          in: "query",
          description: "folders ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Create new Folders",
      tags: ["FileManager"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          allowEmptyValue: false,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                folderName: {
                  type: "string",
                  required: true,
                  description: "folderName",
                  default: "string",
                },
                parentFolderID: {
                  type: "string",
                  required: false,
                  description: "a uuid of a parent folder if it exists",
                  default: "",
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: "Update Folders",
      tags: ["FileManager"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          allowEmptyValue: false,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "folderID",
          in: "query",
          required: true,
          allowEmptyValue: false,
          description: "folders ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "a new folder name",
                  default: "Accounts",
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete folders",
      tags: ["FileManager"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          allowEmptyValue: false,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "folderID",
          in: "query",
          required: true,
          description: "folders ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/filemanager/folder/move": {
    put: {
      summary: "Update Folders",
      tags: ["FileManager"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "folderID",
          in: "query",
          required: true,
          description: "folders ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "targetFolderID",
          in: "query",
          description: "folders ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/filemanager/file/move": {
    put: {
      summary: "Update Folders",
      tags: ["FileManager"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "fileID",
          in: "query",
          required: true,
          description: "file ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "targetFolderID",
          in: "query",
          description: "target folder ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/filemanager/file/extension-images": {
    get: {
      summary: "Get Extension Images",
      tags: ["FileManager"],
      parameters: [
        {
          name: "extensionID",
          in: "query",
          required: true,
          description: "Extension ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Upload Extension Image",
      tags: ["FileManager"],
      parameters: [
        {
          name: "extensionID",
          in: "query",
          required: true,
          description: "Extension ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: {
                  type: "string",
                  format: "binary",
                },
                is_cover: {
                  type: "boolean",
                  description: "Is cover image",
                  default: false,
                },
                alter_text: {
                  type: "string",
                  description: "Alternative text for the image",
                },
              },
            },
          },
        },
      },
      responses,
    },
    put: {
      summary: "Update Extension Image",
      tags: ["FileManager"],
      parameters: [
        {
          name: "extensionImageID",
          in: "query",
          required: true,
          description: "Extension Image ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                is_cover: {
                  type: "boolean",
                  description: "Is cover image",
                },
                alter_text: {
                  type: "string",
                  description: "Alternative text for the image",
                },
              },
            },
          },
        },
      },
      responses,
    },
    delete: {
      summary: "Delete Extension Image",
      tags: ["FileManager"],
      parameters: [
        {
          name: "extensionImageID",
          in: "query",
          required: true,
          allowEmptyValue: false,
          description: "Extension Image ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/filemanager/file/metadata": {
    get: {
      summary: "Get File Metadata",
      tags: ["FileManager"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "fileID",
          in: "query",
          required: false,
          allowEmptyValue: true,
          description: "File ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    post: {
      summary: "Upload File Metadata",
      tags: ["FileManager"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["filename", "identificator", "size", "source", "userID"],
              properties: {
                filename: {
                  type: "string",
                  description: "The file name",
                },
                identificator: {
                  type: "string",
                  description: "File uuid of s3",
                },
                size: {
                  type: "number",
                  description: "File size in bytes",
                },
                source: {
                  type: "string",
                  description: "Source name",
                },
                description: {
                  type: "string",
                  description: "File description",
                },
                userID: {
                  type: "string",
                  description: "The unique identifier (UUID) of the user who uploaded the file.",
                }
              },
            },
          },
        },
      },
      responses,
    },
  },
  "/filemanager/bucket": {
    get: {
      summary: "Get Files from S3",
      tags: ["FileManager"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
  },
  "/filemanager/presigned-url": {
    get: {
      summary: "Create Get Presigned URL",
      tags: ["FileManager"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "fileID",
          in: "query",
          required: true,
          description: "File ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      responses,
    },
    put: {
      summary: "Create Put Presigned URL",
      tags: ["FileManager"],
      parameters: [
        {
          name: "companyID",
          in: "query",
          required: true,
          description: "Company ID",
          schema: {
            type: "string",
          },
        },
        {
          name: "filePath",
          in: "query",
          required: true,
          description: "The file path with the filename of the file, example 'folder/file.txt'",
          schema: {
            type: "string",
          },
        },
        {
          name: "fileSize",
          in: "query",
          required: true,
          description: "File size in bytes",
          schema: {
            type: "integer",
          },
        },
        {
          name: "source",
          in: "query",
          required: false,
          description: "Source name",
          schema: {
            type: "string",
          },
        },
        {
          name: "botID",
          in: "query",
          required: false,
          description: "Bot ID",
          schema: {
            type: "string",
          },
        },
        headers,
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                description: {
                  type: "string",
                  description: "description",
                  default: "A menu about creeps",
                },
              },
            },
          },
        },
      },
      responses,
    },
  },
};
