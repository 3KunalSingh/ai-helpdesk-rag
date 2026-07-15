const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { generateEmbedding } = require('../services/embeddingService');
const { findRelevantDocuments } = require('../services/vectorSearch');
const { generateAnswer } = require('../services/llmService');

// Confidence threshold — lowered to 0.65 for better accuracy
const CONFIDENCE_THRESHOLD = 0.50;

// POST /ask - Process a user query using RAG
router.post('/', async (req, res) => {
  try {
    const { question, sessionId } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // 1. Convert the question into an embedding
    const questionEmbedding = await generateEmbedding(question);

    // 2. Perform vector similarity search to retrieve the most relevant documents
    const topResults = await findRelevantDocuments(questionEmbedding, 3);
    
    // The confidence is the highest similarity score found
    const highestScore = topResults.length > 0 ? topResults[0].similarity : 0;
    
    let answer = "";
    let ticketCreated = false;

    // 3. If similarity score is >= threshold, generate AI answer
    if (highestScore >= CONFIDENCE_THRESHOLD) {
      // 4. Send the retrieved context and user question to the LLM
      const context = topResults.map(r => `Title: ${r.doc.title}\nContent: ${r.doc.content}`).join('\n\n');
      answer = await generateAnswer(question, context);
    } else {
      // 5. If similarity score is below threshold, create a support ticket
      const context = topResults.length > 0
        ? topResults.map(r => `Title: ${r.doc.title}\nContent: ${r.doc.content}`).join('\n\n')
        : '';
      
      // Still generate an AI answer for the ticket record
      let aiAnswer = '';
      if (context) {
        try {
          aiAnswer = await generateAnswer(question, context);
        } catch (e) {
          aiAnswer = 'Could not generate AI answer.';
        }
      }

      const newTicket = new Ticket({
        question,
        aiAnswer,
        confidence: highestScore,
        sessionId: sessionId || '',
        status: 'Pending',
      });
      await newTicket.save();
      ticketCreated = true;
      answer = "I couldn't find a confident answer in the company documents. A support ticket has been automatically created for human review.";
    }

    // 6. Return a concise answer to the user
    res.json({
      answer,
      confidence: highestScore,
      ticketCreated
    });
  } catch (error) {
    console.error('Error in /ask route:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
