const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// GET /tickets - Return all created tickets (public, for backward compat)
router.get('/', async (req, res) => {
  try {
    const tickets = await Ticket.find({ deletedByAdmin: { $ne: true } }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
