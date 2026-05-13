const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { generateEmbedding, chunkText } = require('../services/embeddingService');
const adminAuth = require('../middleware/adminAuth');

// All routes in this file are protected by adminAuth
router.use(adminAuth);

// GET /api/admin/documents - Get all documents (without embedding data for performance)
router.get('/', async (req, res) => {
  try {
    const documents = await Document.find({}).select('-embedding').sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/admin/documents - Upload a new document with embedding (supports chunking)
router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    // Chunk long documents for better retrieval
    const chunks = chunkText(content);
    const savedDocs = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkTitle = chunks.length > 1 ? `${title} [Part ${i + 1}]` : title;
      const embedding = await generateEmbedding(chunks[i]);

      const newDoc = new Document({
        title: chunkTitle,
        content: chunks[i],
        embedding
      });
      await newDoc.save();
      savedDocs.push({ _id: newDoc._id, title: newDoc.title, createdAt: newDoc.createdAt });
    }

    res.status(201).json({
      message: `Document uploaded successfully (${chunks.length} chunk${chunks.length > 1 ? 's' : ''}).`,
      documents: savedDocs
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

// PUT /api/admin/documents/:id - Update an existing document and regenerate embedding
router.put('/:id', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Regenerate embedding for updated content
    const embedding = await generateEmbedding(content);

    doc.title = title;
    doc.content = content;
    doc.embedding = embedding;
    await doc.save();

    res.json({
      message: 'Document updated and embedding regenerated successfully.',
      document: { _id: doc._id, title: doc.title, content: doc.content, createdAt: doc.createdAt }
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

// DELETE /api/admin/documents/:id - Delete a document
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    res.json({ message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
