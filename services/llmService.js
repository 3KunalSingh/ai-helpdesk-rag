const Groq = require("groq-sdk");
require('dotenv').config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Generates an answer based on the provided context and question using Groq.
 * @param {string} question - The user's query.
 * @param {string} context - The combined text of the most relevant retrieved documents.
 * @returns {Promise<string>} - The LLM's answer.
 */
const generateAnswer = async (question, context) => {
  try {
    const prompt = `You are a company helpdesk assistant.
Answer the user's question using only the provided company documents.
If the answer is not contained in the documents, say that you do not know.

Context:
${context}

Question:
${question}

Answer:`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are an internal helpdesk assistant. Only answer based on the provided context. Be concise and helpful." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 300,
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating answer via Groq:", error);
    throw error;
  }
};

module.exports = { generateAnswer };
