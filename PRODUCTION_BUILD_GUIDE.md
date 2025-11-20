# Production Build Guide

This guide explains how to build and test the production version of the Employee Management System.

## Build Configuration

The production build is configured in `vite.config.ts` with the following optimizations:

### Build Optimizations

1. **Code Splitting**
   - Separate chunks for vendor libraries (React, React Router)
   - Separate chunk for ExcelJS (large library)
   - Separate chunk for chart libraries
   - Automatic code splitting for route-based components

2. **Asset Organization**
   - Images: `dist/assets/images/`
   - Fonts: `dist/assets/fonts/`
   - JavaScript: `dist/assets/js/`
   - CSS: `dist/assets/`

3. **Minification**
   - JavaScript minified with esbuild
   - CSS minified automatically
   - HTML minified

4. **Browser Compatibility**
   - Target: ES2015 (modern browsers)
   - Polyfills included automatically by Vite

## Building for Production

### Step 1: Build the Frontend

```bash
npm run build
```

This command:
- Compiles TypeScript to JavaScript
- Bundles all React components
- Minifies code
- Optimizes assets
- Outputs to `dist/` directory

### Step 2: Verify Build Output

Check that the `dist/` directory contains:
```
dist/
├── assets/
│   ├── images/
│   ├── js/
│   │   ├── vendor-[hash].js
│   │   ├── exceljs-[hash].js
│   │   ├── charts-[hash].js
│   │   └── index-[hash].js
│   └── index-[hash].css
├── index.html
└── vite.svg (or other static assets)
```

### Step 3: Test Production Build Locally

#### Option 1: Using Vite Preview

```bash
npm run preview
```

This starts a local server at http://localhost:4173 serving the production build.

**Note**: This only serves the frontend. API calls will fail unless you also run the backend.

#### Option 2: Using Express Server (Recommended)

```bash
# Build frontend
npm run build

# Start Express server (serves both API and frontend)
npm start
```

Access the application at http://localhost:3001

This is the recommended approach as it tests the exact production setup.

## Production Build Checklist

Before deploying to production, verify:

- [ ] Build completes without errors
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] All tests pass: `npm test`
- [ ] Environment variables are set correctly
- [ ] Assets load correctly (check browser console)
- [ ] API calls work (check Network tab)
- [ ] Authentication flow works
- [ ] All routes are accessible
- [ ] Images and fonts load correctly
- [ ] No console errors or warnings

## Testing the Production Build

### 1. Build the Application

```bash
npm run build
```

Expected output:
```
vite v5.x.x building for production...
✓ 1234 modules transformed.
dist/index.html                   x.xx kB
dist/assets/index-abc123.css      xx.xx kB
dist/assets/vendor-def456.js      xxx.xx kB
dist/assets/exceljs-ghi789.js     xxx.xx kB
dist/assets/index-jkl012.js       xxx.xx kB
✓ built in x.xxs
```

### 2. Start the Production Server

```bash
npm start
```

Expected output:
```
Server running in development mode on port 3001
API available at http://localhost:3001/api
Frontend served from http://localhost:3001
MongoDB Connected: cluster0.mongodb.net
```

### 3. Test in Browser

1. Open http://localhost:3001
2. Open browser DevTools (F12)
3. Check Console tab for errors
4. Check Network tab for failed requests
5. Test login functionality
6. Navigate through all pages
7. Test CRUD operations

### 4. Verify Asset Loading

In the Network tab, verify:
- All JavaScript files load (200 status)
- All CSS files load (200 status)
- All images load (200 status)
- API calls return expected data (200 or appropriate status)

## Common Build Issues

### Issue: Build fails with TypeScript errors

**Solution:**
```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix errors in the code
# Then rebuild
npm run build
```

### Issue: Assets not loading (404 errors)

**Cause**: Incorrect base path configuration

**Solution**: Check `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/', // Should be '/' for root deployment
  // ...
});
```

### Issue: API calls fail in production

**Cause**: Frontend trying to call wrong API URL

**Solution**: 
1. Check `VITE_API_BASE_URL` in `.env`
2. Verify ApiClient is using correct base URL
3. Check CORS configuration in Express server

### Issue: Large bundle size

**Solution**: Analyze bundle size:
```bash
npm run build -- --mode analyze
```

Consider:
- Lazy loading routes
- Code splitting
- Removing unused dependencies

### Issue: White screen after deployment

**Causes**:
1. JavaScript errors (check console)
2. Incorrect base path
3. Assets not loading

**Solution**:
1. Check browser console for errors
2. Verify all assets load in Network tab
3. Check Express static file serving configuration

## Build Size Optimization

### Current Bundle Sizes (Approximate)

- Vendor chunk (React, Router): ~150 KB
- ExcelJS chunk: ~400 KB
- Charts chunk: ~300 KB
- Main application: ~200 KB
- Total: ~1 MB (gzipped: ~300 KB)

### Optimization Tips

1. **Lazy Load Routes**
   ```typescript
   const Dashboard = lazy(() => import('./pages/Dashboard'));
   ```

2. **Remove Unused Dependencies**
   ```bash
   npm uninstall <unused-package>
   ```

3. **Use Dynamic Imports**
   ```typescript
   const module = await import('./heavy-module');
   ```

4. **Enable Compression**
   - Express server should use gzip compression
   - Azure App Service enables this by default

## Production Environment Variables

Ensure these are set in production:

```bash
# Backend
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<strong-secret>
JWT_EXPIRATION=24h
NODE_ENV=production
PORT=8080

# Frontend (build-time)
VITE_API_BASE_URL=https://your-domain.com
```

## Deployment to Azure App Service

### Build Command
```bash
npm run build
```

### Start Command
```bash
node server/server.js
```

### Deployment Steps

1. Build locally or in CI/CD pipeline
2. Upload `dist/` folder and `server/` folder
3. Set environment variables in Azure Portal
4. Start the application
5. Verify deployment

See `DEPLOYMENT.md` for detailed Azure deployment instructions.

## Continuous Integration

### GitHub Actions Example

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v2
      with:
        name: dist
        path: dist/
```

## Performance Monitoring

After deployment, monitor:

1. **Page Load Time**: Should be < 3 seconds
2. **Time to Interactive**: Should be < 5 seconds
3. **Bundle Size**: Keep under 1 MB total
4. **API Response Time**: Should be < 500ms

Use browser DevTools Lighthouse for performance audits.

## Troubleshooting Production Issues

### Enable Source Maps (for debugging)

In `vite.config.ts`:
```typescript
build: {
  sourcemap: true, // Enable for debugging
}
```

**Warning**: Don't enable in production as it exposes source code.

### Check Server Logs

```bash
# Azure App Service
az webapp log tail --name <app-name> --resource-group <rg-name>
```

### Test API Separately

```bash
curl https://your-domain.com/api/health
```

Should return:
```json
{"status":"ok","message":"Server is running"}
```

## Additional Resources

- [Vite Build Documentation](https://vitejs.dev/guide/build.html)
- [Express Static Files](https://expressjs.com/en/starter/static-files.html)
- [Azure App Service Node.js](https://docs.microsoft.com/en-us/azure/app-service/quickstart-nodejs)
