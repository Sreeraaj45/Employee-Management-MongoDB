# Environment Configuration Guide

This document explains the environment variables used in the Employee Management System after migration from Supabase to MongoDB.

## Overview

The application uses environment variables for configuration. These are stored in a `.env` file in the root directory.

## Environment Variables

### Backend Configuration (Server-Side Only)

These variables are used by the Express backend and are **NOT** exposed to the frontend:

#### `MONGODB_URI`
- **Description**: MongoDB connection string
- **Required**: Yes
- **Example**: `mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority`
- **Notes**: 
  - For MongoDB Atlas, get this from your cluster's "Connect" button
  - For local MongoDB: `mongodb://localhost:27017/database_name`
  - Keep this secret and never commit to version control

#### `JWT_SECRET`
- **Description**: Secret key for signing JWT tokens
- **Required**: Yes
- **Example**: `your-super-secret-jwt-key-change-this-in-production-minimum-32-characters`
- **Notes**:
  - Must be at least 32 characters for security
  - Use a strong, random string in production
  - Never commit the production secret to version control
  - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

#### `JWT_EXPIRATION`
- **Description**: How long JWT tokens remain valid
- **Required**: Yes
- **Default**: `24h`
- **Examples**: `1h`, `24h`, `7d`, `30d`
- **Notes**: Balance security (shorter) vs user convenience (longer)

#### `PORT`
- **Description**: Port for the Express server
- **Required**: No
- **Default**: `3001`
- **Notes**: Must match the port in `VITE_API_BASE_URL`

#### `NODE_ENV`
- **Description**: Node environment
- **Required**: No
- **Default**: `development`
- **Values**: `development`, `production`, `test`
- **Notes**: Affects logging, error messages, and optimizations

### Frontend Configuration

These variables are exposed to the frontend (prefixed with `VITE_`):

#### `VITE_API_BASE_URL`
- **Description**: Base URL for API requests from frontend
- **Required**: Yes
- **Development**: `http://localhost:3001`
- **Production**: `https://your-domain.com` (or your Azure App Service URL)
- **Notes**: 
  - In development, Vite proxy handles `/api` requests
  - In production, this should point to your deployed backend

## Setup Instructions

### Development Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your values:
   - Set `MONGODB_URI` to your MongoDB connection string
   - Generate a secure `JWT_SECRET`
   - Keep other defaults for local development

3. Start the development servers:
   ```bash
   # Terminal 1: Start backend
   npm run dev:server
   
   # Terminal 2: Start frontend
   npm run dev
   ```

### Production Setup (Azure App Service)

1. In Azure Portal, navigate to your App Service

2. Go to **Configuration** → **Application settings**

3. Add the following environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A strong, random secret (32+ characters)
   - `JWT_EXPIRATION`: `24h` (or your preferred duration)
   - `NODE_ENV`: `production`
   - `PORT`: `8080` (or Azure's default)
   - `VITE_API_BASE_URL`: Your App Service URL (e.g., `https://your-app.azurewebsites.net`)

4. Save and restart the App Service

## Security Best Practices

1. **Never commit `.env` to version control**
   - The `.env` file is in `.gitignore`
   - Only commit `.env.example` with placeholder values

2. **Use strong secrets in production**
   - Generate random JWT secrets
   - Use complex MongoDB passwords
   - Rotate secrets periodically

3. **Restrict MongoDB access**
   - Use MongoDB Atlas IP whitelist
   - Create database users with minimal required permissions
   - Enable MongoDB Atlas encryption at rest

4. **Use HTTPS in production**
   - Azure App Service provides free SSL certificates
   - Ensure `VITE_API_BASE_URL` uses `https://`

## Troubleshooting

### Frontend can't connect to backend

- Check that `VITE_API_BASE_URL` is set correctly
- In development, ensure backend is running on port 3001
- Check browser console for CORS errors

### Authentication errors

- Verify `JWT_SECRET` is set and matches between deployments
- Check that `JWT_EXPIRATION` is valid format
- Ensure tokens aren't expired

### Database connection errors

- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist includes your server
- Ensure database user has correct permissions

## Migration from Supabase

The following Supabase variables have been **removed**:
- ~~`VITE_SUPABASE_URL`~~ - No longer needed
- ~~`VITE_SUPABASE_ANON_KEY`~~ - No longer needed

These have been replaced with:
- `MONGODB_URI` - For database connection
- `JWT_SECRET` - For authentication
- `VITE_API_BASE_URL` - For API communication

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Azure App Service Configuration](https://docs.microsoft.com/en-us/azure/app-service/configure-common)
