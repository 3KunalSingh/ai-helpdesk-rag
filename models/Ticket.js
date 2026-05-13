const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  aiAnswer: {
    type: String,
    default: '',
  },
  confidence: {
    type: Number,
    default: 0,
  },
  sessionId: {
    type: String,
    default: '',
  },
  adminReply: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Pending', 'Resolved', 'Closed'],
    default: 'Pending',
  },
  deletedByAdmin: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Ticket', TicketSchema);
