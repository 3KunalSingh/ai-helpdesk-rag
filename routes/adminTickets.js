const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const adminAuth = require('../middleware/adminAuth');

// All routes in this file are protected by adminAuth
router.use(adminAuth);

// GET /api/admin/tickets - Get all non-deleted tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await Ticket.find({ deletedByAdmin: { $ne: true } }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/admin/tickets/:id/reply - Add admin reply and auto-resolve
router.put('/:id/reply', async (req, res) => {
  try {
    const { adminReply } = req.body;

    if (!adminReply || !adminReply.trim()) {
      return res.status(400).json({ error: 'Admin reply is required.' });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { 
        adminReply: adminReply.trim(),
        status: 'Resolved'  // Auto-resolve when admin replies
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    res.json({ message: 'Reply added and ticket resolved.', ticket });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/admin/tickets/:id/status - Update ticket status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Resolved', 'Closed'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    res.json({ message: 'Status updated successfully.', ticket });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/admin/tickets/:id - Soft delete a ticket
router.delete('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { deletedByAdmin: true },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    res.json({ message: 'Ticket deleted successfully.' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
