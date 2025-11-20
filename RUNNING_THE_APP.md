# Running the Application

This guide explains how to run the Employee Management System in different environments.

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account or local MongoDB instance
- Environment variables configured (see `.env.example`)

## Development Mode

### Option 1: Run Frontend and Backend Separately (Recommended)

This is the recommended approach for development as it provides hot reload for both frontend and backend.

**Terminal 1 - Backend Server:**
```bash
npm run dev:server
```
This starts the Express server on port 3001 with MongoDB connection.

**Terminal 2 - Frontend Dev Server:**
```bash
npm run dev
```
This starts the Vite dev server on port 5173 with hot reload.

The frontend will automatically proxy API requests to the backend (configured in `vite.config.ts`).

### Option 2: Quick Start Message

```bash
npm run dev:all
```
This displays instructions to run both servers.

### Accessing the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## Production Mode

### Build and Run

```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

Or use the combined command:
```bash
npm run build:full
```

### Production with Environment Variable

```bash
npm run start:prod
```

This sets `NODE_ENV=production` and starts the server.

### Accessing the Application

- **Application**: http://localhost:3001
- **API**: http://localhost:3001/api

In production mode, the Express server serves both the API and the built frontend from the `dist/` folder.

## Testing

### Run All Tests Once

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test File

```bash
npm test -- server/tests/authService.test.js
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run dev:server` | Start Express server (backend only) |
| `npm run dev:all` | Show instructions for running both |
| `npm run build` | Build frontend for production |
| `npm run build:full` | Build frontend and start production server |
| `npm start` | Start production server |
| `npm run start:prod` | Start production server with NODE_ENV=production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## First Time Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

4. **Start development servers**
   ```bash
   # Terminal 1
   npm run dev:server
   
   # Terminal 2
   npm run dev
   ```

5. **Access the application**
   - Open http://localhost:5173 in your browser
   - Default admin credentials will be logged in the backend terminal

## Default Admin User

On first startup, if no users exist in the database, a default admin user will be created automatically. The credentials will be displayed in the backend server console:

```
======================================================================
DEFAULT ADMIN USER CREATED
======================================================================
Email:    admin@company.com
Password: <randomly-generated-password>
======================================================================
IMPORTANT: Please login and change the password immediately!
======================================================================
```

**Important**: Copy these credentials and change the password after first login!

## Troubleshooting

### Backend won't start

- Check that MongoDB URI is correct in `.env`
- Ensure MongoDB Atlas IP whitelist includes your IP
- Verify JWT_SECRET is set in `.env`

### Frontend can't connect to backend

- Ensure backend is running on port 3001
- Check that `VITE_API_BASE_URL` is set correctly in `.env`
- Verify proxy configuration in `vite.config.ts`

### Port already in use

If port 3001 or 5173 is already in use:

**Change backend port:**
- Update `PORT` in `.env`
- Update `VITE_API_BASE_URL` to match
- Update proxy target in `vite.config.ts`

**Change frontend port:**
```bash
npm run dev -- --port 3000
```

### Tests failing

- Ensure MongoDB is accessible
- Check that test database is separate from development database
- Run tests with verbose output: `npm test -- --reporter=verbose`

### Build errors

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check TypeScript errors: `npx tsc --noEmit`

## Development Workflow

1. **Start both servers** (frontend and backend)
2. **Make changes** to code
3. **Frontend changes** auto-reload in browser
4. **Backend changes** require server restart (Ctrl+C and `npm run dev:server` again)
5. **Run tests** to verify changes
6. **Commit** when tests pass

## Production Deployment

See `DEPLOYMENT.md` for detailed deployment instructions for Azure App Service.

Quick checklist:
- [ ] Set all environment variables in Azure
- [ ] Build frontend: `npm run build`
- [ ] Deploy to Azure App Service
- [ ] Verify MongoDB connection
- [ ] Test authentication flow
- [ ] Check all API endpoints

## Additional Resources

- [Environment Setup Guide](ENVIRONMENT_SETUP.md)
- [API Documentation](API_DOCUMENTATION.md) (if available)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Vite Documentation](https://vitejs.dev/)
