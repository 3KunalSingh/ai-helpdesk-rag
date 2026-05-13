const { pipeline, env } = require('@xenova/transformers');

// Prevent loading local models from the file system
env.allowLocalModels = false;

let extractor;

/**
 * Singleton function to load the pipeline.
 * We use Xenova/all-MiniLM-L6-v2 which generates 384-dimensional embeddings.
 */
const getExtractor = async () => {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
};

/**
 * Generates an embedding for a given text locally using Transformers.js.
 * @param {string} text - The input text to embed.
 * @returns {Promise<number[]>} - The normalized vector embedding.
 */
const generateEmbedding = async (text) => {
  try {
    const extract = await getExtractor();
    const output = await extract(text, { pooling: 'mean', normalize: true });
    
    // output.data is a Float32Array, convert it to a standard JavaScript array
    return Array.from(output.data);
  } catch (error) {
    console.error("Error generating local embedding:", error);
    throw error;
  }
};

/**
 * Splits long text into smaller chunks for better embedding quality.
 * Each chunk is 500-1000 characters, splitting at sentence boundaries.
 * @param {string} text - The full document text.
 * @param {number} maxChunkSize - Maximum characters per chunk (default 800).
 * @param {number} overlap - Overlap characters between chunks (default 100).
 * @returns {string[]} - Array of text chunks.
 */
const chunkText = (text, maxChunkSize = 800, overlap = 100) => {
  if (!text || text.length <= maxChunkSize) {
    return [text];
  }

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxChunkSize, text.length);

    // Try to split at a sentence boundary (., !, ?, newline)
    if (end < text.length) {
      const slice = text.substring(start, end);
      const lastSentenceEnd = Math.max(
        slice.lastIndexOf('. '),
        slice.lastIndexOf('.\n'),
        slice.lastIndexOf('! '),
        slice.lastIndexOf('? '),
        slice.lastIndexOf('\n\n')
      );
      if (lastSentenceEnd > maxChunkSize * 0.3) {
        end = start + lastSentenceEnd + 1;
      }
    }

    chunks.push(text.substring(start, end).trim());
    start = end - overlap;
    
    // Prevent infinite loop
    if (start >= text.length - overlap) break;
  }

  // Add the remainder if there's any meaningful text left
  if (start < text.length) {
    const remainder = text.substring(start).trim();
    if (remainder.length > 50 && remainder !== chunks[chunks.length - 1]) {
      chunks.push(remainder);
    }
  }

  return chunks.filter(c => c.length > 0);
};

module.exports = { generateEmbedding, chunkText };
