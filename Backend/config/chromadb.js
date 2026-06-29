const { ChromaClient } = require('chromadb');
const mongoose = require('mongoose');

// Define Schema for MongoDB-based Vector Store Fallback
const vectorChunkSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  documentId: { type: String, required: true, index: true },
  userId: { type: String },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

let VectorChunk;
try {
  VectorChunk = mongoose.model('VectorChunk');
} catch {
  VectorChunk = mongoose.model('VectorChunk', vectorChunkSchema);
}

// Simple Cosine Similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Mock Collection implementation backed by MongoDB
class MongoCollectionMock {
  constructor(name) {
    this.name = name;
  }

  async add({ ids, documents, embeddings, metadatas }) {
    const ops = ids.map((id, idx) => ({
      updateOne: {
        filter: { id },
        update: {
          id,
          documentId: metadatas[idx].documentId,
          userId: metadatas[idx].userId,
          text: documents[idx],
          embedding: embeddings[idx],
          metadata: metadatas[idx],
        },
        upsert: true,
      }
    }));
    await VectorChunk.bulkWrite(ops);
    return true;
  }

  async query({ queryEmbeddings, nResults, where }) {
    const queryVector = queryEmbeddings[0];
    const filter = {};
    if (where && where.documentId) {
      filter.documentId = where.documentId;
    }

    const chunks = await VectorChunk.find(filter);
    
    // Calculate similarities
    const scored = chunks.map((c) => {
      const similarity = cosineSimilarity(queryVector, c.embedding);
      return {
        id: c.id,
        text: c.text,
        metadata: c.metadata,
        similarity,
      };
    });

    // Sort by highest similarity
    scored.sort((a, b) => b.similarity - a.similarity);
    const top = scored.slice(0, nResults);

    return {
      ids: [top.map(c => c.id)],
      documents: [top.map(c => c.text)],
      metadatas: [top.map(c => c.metadata)],
      distances: [top.map(c => 1 - c.similarity)], // Cosine distance = 1 - Cosine similarity
    };
  }

  async get({ where }) {
    const filter = {};
    if (where && where.documentId) {
      filter.documentId = where.documentId;
    }
    const chunks = await VectorChunk.find(filter);
    return {
      ids: chunks.map(c => c.id),
      documents: chunks.map(c => c.text),
      metadatas: chunks.map(c => c.metadata),
    };
  }

  async delete({ ids }) {
    if (ids && ids.length > 0) {
      await VectorChunk.deleteMany({ id: { $in: ids } });
    }
    return true;
  }
}

let client = null;
let useFallback = false;

const getChromaClient = async () => {
  if (useFallback) return null;
  if (!client) {
    try {
      client = new ChromaClient({
        path: process.env.CHROMA_URL || 'http://localhost:8000',
      });
      // Check if server is reachable
      await client.heartbeat();
      console.log('📡 Connected to ChromaDB Server');
    } catch (err) {
      console.log('⚠️ ChromaDB Server not reachable. Falling back to MongoDB Vector Store.');
      useFallback = true;
      client = null;
    }
  }
  return client;
};

const getOrCreateCollection = async (collectionName = 'document_chunks') => {
  const chromaClient = await getChromaClient();
  if (useFallback || !chromaClient) {
    return new MongoCollectionMock(collectionName);
  }
  try {
    const collection = await chromaClient.getOrCreateCollection({
      name: collectionName,
      metadata: { 'hnsw:space': 'cosine' },
    });
    return collection;
  } catch (err) {
    console.log('⚠️ ChromaDB getOrCreateCollection error. Falling back to MongoDB Vector Store.');
    useFallback = true;
    return new MongoCollectionMock(collectionName);
  }
};

module.exports = {
  getChromaClient,
  getOrCreateCollection,
};
