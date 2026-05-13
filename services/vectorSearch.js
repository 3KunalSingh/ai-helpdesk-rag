const Document = require('../models/Document');

/**
 * Calculates the cosine similarity between two normalized vectors.
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number} - Similarity score between -1 and 1.
 */
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Normalizes a vector to unit length for consistent cosine similarity.
 * @param {number[]} vec - The input vector.
 * @returns {number[]} - The normalized vector.
 */
const normalizeVector = (vec) => {
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) return vec;
  return vec.map(v => v / norm);
};

/**
 * Retrieves the top K most similar documents to the query embedding.
 * @param {number[]} queryEmbedding - The embedding of the user's question.
 * @param {number} topK - Number of documents to return.
 * @returns {Promise<Array>} - Array of objects containing { doc, similarity }.
 */
const findRelevantDocuments = async (queryEmbedding, topK = 3) => {
  // Fetch all documents from the database
  const allDocs = await Document.find({});
  
  if (allDocs.length === 0) return [];

  // Normalize the query embedding
  const normalizedQuery = normalizeVector(queryEmbedding);

  const scoredDocs = allDocs.map(doc => {
    // Normalize stored embedding as well for consistent comparison
    const normalizedDoc = normalizeVector(doc.embedding);
    const similarity = cosineSimilarity(normalizedQuery, normalizedDoc);
    return {
      doc,
      similarity
    };
  });

  // Sort by highest similarity first
  scoredDocs.sort((a, b) => b.similarity - a.similarity);
  
  return scoredDocs.slice(0, topK);
};

module.exports = { cosineSimilarity, normalizeVector, findRelevantDocuments };
