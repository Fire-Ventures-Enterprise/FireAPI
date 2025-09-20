# FireAPI.dev - Construction Intelligence API

🔥 **Production-ready RESTful API for construction management platforms**

## 🚀 Quick Deploy to Railway

### 1. One-Click Deploy
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

### 2. Manual Deployment Steps

```bash
# Clone or download the /api folder
cd api/

# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up

# Set custom domain (optional)
railway domain add fireapi.dev
```

### 3. Environment Variables (Set in Railway Dashboard)
```
NODE_ENV=production
PORT=3000
API_VERSION=1.0.0
```

## 📡 API Endpoints

### Core Construction Intelligence
- `POST /api/projects/analyze` - AI project analysis
- `POST /api/projects/complete-analysis` - Full analysis (recommended)
- `POST /api/workflows/generate` - Workflow generation
- `POST /api/costs/estimate` - Regional cost estimation

### Utility Endpoints  
- `GET /api/health` - Health status
- `GET /api/costs/regions` - Available regions
- `GET /api/workflows/templates` - Workflow templates
- `GET /docs` - Complete API documentation

## 🔌 Integration Example

```javascript
// Call from FireBuild.AI or any platform
const response = await fetch('https://fireapi.dev/api/projects/complete-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: "Kitchen renovation: new cabinets, quartz countertops @$120/sqft for 180 sqft",
    region: "toronto"
  })
});

const result = await response.json();
```

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Check health
npm run health
```

## 📊 Features

- ✅ **AI Project Analysis** - Natural language processing
- ✅ **Intelligent Workflows** - Task dependencies & critical path
- ✅ **Regional Pricing** - 35+ North American markets
- ✅ **Building Codes** - Compliance & inspection requirements
- ✅ **Production Ready** - Error handling, rate limiting, monitoring
- ✅ **Comprehensive Testing** - 25+ integration test scenarios

## 🌍 Supported Regions

**Canada:** Toronto, Vancouver, Montreal, Calgary, Edmonton, Ottawa, Winnipeg  
**USA:** New York, Los Angeles, Chicago, Houston, Phoenix, San Francisco, Boston, Seattle, Denver + 20 more

## 🔒 Security Features

- Rate limiting (100 req/15min, 10 req/15min for intensive endpoints)
- Input validation & sanitization
- CORS configuration for firebuild.ai integration
- Helmet.js security headers
- Request compression & optimization

## 📈 Monitoring

- Built-in health checks at `/api/health`
- Request/response logging
- Error tracking and metrics
- Performance monitoring

## 🎯 Built For

- Construction management platforms
- Contractor tools & marketplaces
- Estimation & bidding software
- Project planning applications
- Financial & insurance platforms

## 📚 Documentation

Complete API documentation available at: `https://fireapi.dev/docs`

## 🆘 Support

- API Status: https://fireapi.dev/api/health
- Documentation: https://fireapi.dev/docs
- Statistics: https://fireapi.dev/stats