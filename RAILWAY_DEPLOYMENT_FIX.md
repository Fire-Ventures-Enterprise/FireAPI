# 🚨 **RAILWAY DEPLOYMENT FIX - fireapi.dev Backend Issue**

## 🔍 **PROBLEM DIAGNOSIS**

**Issue**: `https://fireapi.dev` serves frontend HTML instead of backend JSON API  
**Expected**: Backend API responses like `{"status": "healthy", "service": "FireAPI"}`  
**Actual**: Frontend HTML landing page  
**Impact**: External API integrations failing, production blocked  

---

## 🚀 **SOLUTION: Railway Configuration Fix**

### **✅ Step 1: Verify Current Configuration**

The current configuration should be correct:
```json
// railway.json
{
  "deploy": {
    "startCommand": "node app.js",
    "healthcheckPath": "/api/health"
  }
}
```

```json  
// package.json
{
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  }
}
```

### **🔧 Step 2: Ensure Correct Entry Point**

Make sure `app.js` starts the Express server properly:

```javascript
// At the end of app.js - ensure this exists:
const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 FireAPI running on port ${PORT}`);
    console.log(`🌐 API available at: http://localhost:${PORT}/api`);
    console.log(`📚 Documentation: http://localhost:${PORT}/docs`);
    console.log(`❤️ Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully');
    server.close(() => {
        console.log('💤 Process terminated');
        process.exit(0);
    });
});
```

### **🚨 Step 3: Check for Static File Serving Conflict**

**CRITICAL**: Ensure no static file serving that might override API routes:

```javascript
// WRONG - This could serve index.html for all routes:
// app.use(express.static('public')); // ❌ Remove or fix

// RIGHT - Serve static files only for specific path:
app.use('/static', express.static('public')); // ✅ Correct

// Or ensure API routes come BEFORE static serving:
// API routes first
app.use('/api', apiRoutes);

// Static files last (and only if needed)
app.use(express.static('public', { 
  index: false  // Don't serve index.html for directory requests
}));
```

---

## 🔍 **DEBUGGING RAILWAY DEPLOYMENT**

### **📋 Railway CLI Commands**
```bash
# 1. Check current deployment status
railway status

# 2. View live logs
railway logs --follow

# 3. Check environment variables
railway variables

# 4. Test local build
railway run npm start

# 5. Force redeploy
railway up --force
```

### **🌐 Test API Endpoints**
```bash
# Test health endpoint (should return JSON, not HTML)
curl -I https://fireapi.dev/api/health

# Expected Response Headers:
# Content-Type: application/json
# Status: 200 OK

# Test with API key
curl -H "X-API-Key: fb_demo_68657471b5a684d79aed27f4a56c229b" \
     https://fireapi.dev/api/health
```

---

## 🛠️ **RAILWAY CONFIGURATION FIXES**

### **📄 Create/Update .railwayignore**
```
# .railwayignore
node_modules/
*.log
.env
.env.local
tests/
docs/
*.md
*.html
public/
static/
frontend/
client/
```

### **🔧 Update railway.json**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci --only=production"
  },
  "deploy": {
    "startCommand": "node app.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "environments": {
    "production": {
      "variables": {
        "NODE_ENV": "production",
        "PORT": "${{ PORT }}"
      }
    }
  }
}
```

### **🐳 Update Dockerfile (if using Docker)**
```dockerfile
FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy ONLY backend files (exclude frontend)
COPY app.js ./
COPY index.js ./
COPY api-key-auth.js ./
COPY microservices-integration.js ./
COPY microservices/ ./microservices/
COPY *.js ./

# Remove any HTML files that might interfere
RUN rm -f *.html

# Create user and set permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S fireapi -u 1001
USER fireapi

EXPOSE 3000

# Health check for backend API
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "app.js"]
```

---

## 🚨 **EMERGENCY DEPLOYMENT PROCEDURE**

### **⚡ Quick Fix Steps**
1. **Remove Static Files**: Delete any `index.html` or static assets from root
2. **Update Entry Point**: Ensure `app.js` is the main server file
3. **Check Route Order**: API routes must come before any static file serving
4. **Redeploy**: Force redeploy with `railway up --force`
5. **Verify**: Test `curl https://fireapi.dev/api/health` returns JSON

### **🔄 Alternative: Create New Railway Service**
If the current deployment is corrupted:

```bash
# 1. Create new Railway project
railway new fireapi-backend

# 2. Link to repository
railway link

# 3. Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3000

# 4. Deploy
railway up

# 5. Update domain
railway domain add fireapi.dev
```

---

## ✅ **VERIFICATION CHECKLIST**

After deployment fix:

- [ ] `curl https://fireapi.dev/api/health` returns JSON (not HTML)
- [ ] Content-Type header is `application/json`
- [ ] Status code is 200 OK
- [ ] API key authentication works:
  ```bash
  curl -H "X-API-Key: fb_demo_68657471b5a684d79aed27f4a56c229b" \
       https://fireapi.dev/api/health
  ```
- [ ] All API endpoints respond with JSON:
  - `/api/health` - Health check
  - `/api/estimates/multi-trade` - Main estimation
  - `/api/carpentry/cabinets` - Trade-specific API
  - `/api/trades/available` - Service discovery
- [ ] No HTML responses on API endpoints
- [ ] CORS headers present for firebuild.ai domain

---

## 🔥 **IMMEDIATE ACTION REQUIRED**

1. **Check Current Deployment** (5 minutes)
   ```bash
   curl -v https://fireapi.dev/api/health
   ```

2. **Identify Root Cause** (10 minutes)
   - Static file serving conflict?
   - Wrong entry point?
   - Route ordering issue?

3. **Apply Fix** (15 minutes)
   - Update configuration
   - Remove conflicting files
   - Redeploy

4. **Verify Fix** (5 minutes)
   - Test all API endpoints
   - Confirm JSON responses
   - Validate API key authentication

**🎯 Total time to fix: ~35 minutes**

Once this is resolved, FireBuild.AI can immediately begin using the production API keys for full integration!

---

## 📞 **SUPPORT ESCALATION**

If the fix doesn't work immediately:

1. **Railway Support**: Check Railway dashboard for deployment logs
2. **DNS Issues**: Verify domain pointing to correct service
3. **Caching Issues**: Clear CDN cache if using one
4. **Service Conflict**: Ensure no duplicate services running

**Critical**: This deployment fix unblocks the entire Phase 1 development timeline. Priority: 🚨 IMMEDIATE