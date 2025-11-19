# Backend Server

This directory contains the Express.js backend server for the Employee Management System.

## Directory Structure

```
server/
├── config/           # Configuration files
│   ├── database.js   # MongoDB connection setup
│   └── env.js        # Environment variable configuration
├── models/           # Mongoose schemas and models
├── routes/           # API route definitions
├── middleware/       # Express middleware (auth, error handling, etc.)
├── services/         # Business logic and services
├── utils/            # Helper functions and utilities
└── server.js         # Main server entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account or local MongoDB instance
- Environment variables configured in `.env` file

### Environment Variables

Copy `.env.example` to `.env` and configure:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h
PORT=3001
NODE_ENV=development
```

### Running the Server

**Development mode:**
```bash
npm run dev:server
```

**Production mode:**
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

Additional endpoints will be added as features are implemented.

## Features

- Express.js REST API
- MongoDB with Mongoose ODM
- JWT-based authentication
- CORS enabled
- Static file serving for React frontend (production)
- Error handling middleware
- Environment variable validation

## Notes

- In development, the frontend runs on Vite dev server (port 5173) and proxies API requests to this backend (port 3001)
- In production, this server serves both the API and the built frontend from the `dist/` folder
