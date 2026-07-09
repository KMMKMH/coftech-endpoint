const logger = require("./logger");

const createOrGetIndex = async (pinecone, indexName) => {
  const dimension = 768;
  const { indexes: existingIndexes } = await pinecone.listIndexes();

  if (!existingIndexes?.some((idx) => idx.name === indexName)) {
    await pinecone.createIndex({
      name: indexName,
      dimension,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
      waitUntilReady: true,
    });
  }

  return await pinecone.index(indexName);
};

const saveVectors = async (index, payload) => {
  try {
    await index.upsert(payload);
    return "Vectors saved successfully";
  } catch (error) {
    logger.error(`Error saving vectors to Pinecone: ${error}`);
    throw new Error(error.message);
  }
};

const getSimilarVectors = async (index, vector, k = 3, fileID) => {
  return await index.query({
    vector: vector,
    topK: k,
    includeMetadata: true,
    ...(fileID && { filter: { fileID: { $eq: fileID } } }),
  });
};

const getIndexes = async (pinecone) => {
  try {
    const { indexes } = await pinecone.listIndexes();
    return indexes;
  } catch (error) {
    logger.error(`Error getting indexes from Pinecone: ${error}`);
    throw new Error(error.message);
  }
};

const deleteDocumentChunks = async (index, fileID) => {
  try {
    let vectors = [];
    let next = null;

    do {
      const result = await index.listPaginated({
        prefix: `${fileID}`,
        ...(next && { paginationToken: next }),
      });

      const { vectors: currentVectors, pagination } = result;

      next = pagination?.next;
      vectors = vectors.concat(currentVectors);
    } while (next !== undefined);

    if (!vectors.length) {
      throw new Error(`Document with ID ${fileID} not found in Pinecone`);
    }

    vectors = vectors.map((vector) => vector.id);

    await index.deleteMany(vectors);
    return "Document deleted successfully";
  } catch (error) {
    logger.error(`Error deleting embedding from Pinecone: ${error}`);
    throw new Error(error.message);
  }
};

const updateMetadata = async (index, { id, metadata }) => {
  try {
    await index.update({
      id,
      metadata,
    });
    return `Metadata updated for ID ${id}`;
  } catch (error) {
    logger.error(`Error updating metadata in Pinecone: ${error}`);
    throw new Error(error.message);
  }
};

module.exports = {
  createOrGetIndex,
  saveVectors,
  getSimilarVectors,
  getIndexes,
  deleteDocumentChunks,
  updateMetadata,
};
