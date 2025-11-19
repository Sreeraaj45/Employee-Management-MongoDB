import dotenv from 'dotenv';

// Load environment variables for testing
dotenv.config();

// Set test environment variables if not already set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long';
}

if (!process.env.JWT_EXPIRATION) {
  process.env.JWT_EXPIRATION = '24h';
}

if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
}
