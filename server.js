require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const Ticket = require('./models/Ticket');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Public Routes (no auth required)
const askRoute = require('./routes/ask');
const ticketsRoute = require('./routes/tickets');

app.use('/ask', askRoute);
app.use('/tickets', ticketsRoute);

// Public: Get user's own tickets by sessionId
app.get('/api/my-tickets', async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required.' });
    }
    const tickets = await Ticket.find({
      sessionId,
      deletedByAdmin: { $ne: true }
    }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Routes
const adminAuthRoute = require('./routes/adminAuth');
const adminTicketsRoute = require('./routes/adminTickets');
const adminDocumentsRoute = require('./routes/adminDocuments');

app.use('/api/admin', adminAuthRoute);
app.use('/api/admin/tickets', adminTicketsRoute);
app.use('/api/admin/documents', adminDocumentsRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
