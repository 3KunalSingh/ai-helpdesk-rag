# AI-Powered Helpdesk System with Admin Panel

An intelligent helpdesk application using **RAG (Retrieval-Augmented Generation)** to answer employee questions from company documents. Features a secure admin panel for managing tickets and the knowledge base.

## Features

### Public Users
- Ask questions and receive AI-generated answers from the knowledge base
- Automatic ticket creation when confidence is low
- View own tickets and admin replies via browser session tracking
- Light/Dark theme toggle

### Admin Panel
- Secure JWT-based authentication
- **Ticket Management**: View, reply (auto-resolves), update status, soft-delete tickets
- **Document Management**: Full CRUD with automatic embedding regeneration and text chunking

### RAG Improvements
- Text chunking for long documents (500-1000 chars)
- Vector normalization before cosine similarity
- Lowered confidence threshold (0.65) for better accuracy
- Improved LLM prompt with temperature 0.1 and max_tokens 300

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **AI/ML**: Groq API (LLM), @xenova/transformers (local embeddings)
- **Auth**: JWT + bcryptjs
- **Frontend**: Vanilla HTML/CSS/JS

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/helpdesk_rag
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_secure_secret
```

### 3. Create Admin Account

```bash
node scripts/createAdmin.js admin admin123
```

### 4. Start the Server

```bash
node server.js
```

The server runs at `http://localhost:3000`.

## Usage

| URL | Purpose |
|-----|---------|
| `http://localhost:3000` | Public helpdesk (ask questions + view tickets) |
| `http://localhost:3000/admin-login.html` | Admin login page |
| `http://localhost:3000/admin.html` | Admin dashboard (requires login) |

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ask` | Ask a question (RAG pipeline) |
| GET | `/tickets` | View all tickets |
| GET | `/api/my-tickets?sessionId=...` | Get user's own tickets |

### Admin Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login (returns JWT) |

### Admin - Tickets (protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/tickets` | Get all tickets |
| PUT | `/api/admin/tickets/:id/reply` | Reply + auto-resolve |
| PUT | `/api/admin/tickets/:id/status` | Update ticket status |
| DELETE | `/api/admin/tickets/:id` | Soft-delete ticket |

### Admin - Documents (protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/documents` | Get all documents |
| POST | `/api/admin/documents` | Upload (with auto-chunking) |
| PUT | `/api/admin/documents/:id` | Update document |
| DELETE | `/api/admin/documents/:id` | Delete document |

## Project Structure

```
noderag/
├── config/db.js
├── middleware/adminAuth.js
├── models/
│   ├── Admin.js
│   ├── Document.js
│   └── Ticket.js
├── public/
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   ├── admin-login.html
│   ├── admin.html
│   ├── admin-script.js
│   └── admin-style.css
├── routes/
│   ├── adminAuth.js
│   ├── adminDocuments.js
│   ├── adminTickets.js
│   ├── ask.js
│   └── tickets.js
├── scripts/createAdmin.js
├── services/
│   ├── embeddingService.js
│   ├── llmService.js
│   └── vectorSearch.js
├── .env.example
├── package.json
├── server.js
└── README.md
```
