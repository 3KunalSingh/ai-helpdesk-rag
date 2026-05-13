const { generateEmbedding } = require('./services/embeddingService');

(async () => {
  try {
    console.log("Generating embedding...");
    const result = await generateEmbedding("Test text");
    console.log("Embedding generated:", result.slice(0, 5));
  } catch (error) {
    console.error("Script Error:", error);
  }
})();
