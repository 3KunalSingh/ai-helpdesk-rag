const mongoose = require('mongoose');
const Document = require('./models/Document');
const { generateEmbedding } = require('./services/embeddingService');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    
    console.log("Generating embedding...");
    const embedding = await generateEmbedding("Test document content");
    console.log("Embedding length:", embedding.length);

    console.log("Saving document...");
    const newDoc = new Document({
      title: "Test",
      content: "Test document content",
      embedding
    });
    await newDoc.save();
    console.log("Saved successfully!");

  } catch (error) {
    console.error("Test Error:", error);
  } finally {
    mongoose.disconnect();
  }
})();
