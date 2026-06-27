const { generateEmbedding } = require('../config/gemini');
const { getOrCreateCollection } = require('../config/chromadb');
const crypto = require('crypto');

/**
 * Generate embeddings and store chunks in ChromaDB
 */
const embedAndStoreChunks = async (chunks, documentId, userId) => {
  const collection = await getOrCreateCollection();

  const batchSize = 10;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    const ids = batch.map(() => crypto.randomUUID());
    const documents = batch.map((c) => c.text);
    const metadatas = batch.map((c) => ({
      documentId: documentId.toString(),
      userId: userId.toString(),
      chunkIndex: c.index,
      charStart: c.charStart,
      charEnd: c.charEnd,
    }));

    // Generate embeddings
    const embeddings = [];
    for (const chunk of batch) {
      const embedding = await generateEmbedding(chunk.text);
      embeddings.push(embedding);
    }

    await collection.add({
      ids,
      documents,
      embeddings,
      metadatas,
    });
  }

  return chunks.length;
};

/**
 * Search for relevant chunks using semantic search
 */
const searchChunks = async (query, documentId, topK = 5) => {
  const collection = await getOrCreateCollection();
  const queryEmbedding = await generateEmbedding(query);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    where: { documentId: documentId.toString() },
  });

  if (!results || !results.documents || !results.documents[0]) {
    return [];
  }

  return results.documents[0].map((doc, idx) => ({
    text: doc,
    metadata: results.metadatas[0][idx],
    distance: results.distances ? results.distances[0][idx] : null,
  }));
};

/**
 * Delete all chunks for a document
 */
const deleteDocumentChunks = async (documentId) => {
  try {
    const collection = await getOrCreateCollection();
    const results = await collection.get({
      where: { documentId: documentId.toString() },
    });
    if (results.ids && results.ids.length > 0) {
      await collection.delete({ ids: results.ids });
    }
  } catch (error) {
    console.error('Error deleting chunks:', error.message);
  }
};

module.exports = { embedAndStoreChunks, searchChunks, deleteDocumentChunks };
