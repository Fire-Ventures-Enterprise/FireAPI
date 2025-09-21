# 🔥 **LOVABLE PROMPT: FireAPI.dev Construction Intelligence Platform**

## 📋 **PROJECT REQUEST**

Create a professional API landing page and documentation site for **FireAPI.dev** - a construction intelligence platform with microservices architecture for trade-specific estimates.

---

## 🎯 **LANDING PAGE REQUIREMENTS**

### **🏗️ Hero Section**
- **Title**: "FireAPI.dev - Construction Intelligence Platform"
- **Subtitle**: "AI-powered microservices API for construction estimates with user-editable pricing"
- **Key Features**: 
  - ✅ Multi-trade orchestration
  - ✅ Natural language processing  
  - ✅ User-editable pricing (no liability)
  - ✅ Production-ready microservices
- **CTA Button**: "Get API Access" (links to API key section)
- **Live Status**: Show API health with green indicator

### **🎪 Architecture Overview**
Visual diagram showing:
```
┌─────────────────────────────────────┐
│         Main Orchestrator           │
│      (Multi-trade coordinator)      │
└─────────────┬───────────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│Carpentry│Electrical│Plumbing│
│  API   │   API   │  API   │
│ ✅Live │ 🏗️Ready │ 🏗️Ready │
└───────┘ └───────┘ └───────┘
```

---

## 🔧 **TRADE APIS SECTION**

### **🔨 Currently Live APIs**
Create individual cards for each trade:

#### **Carpentry API - LIVE** 
- **Status**: ✅ Production Ready
- **Specialization**: Kitchen Cabinets, Trim, Framing, Doors
- **URL**: `https://3001-i0k34xlfbjev6sx7pzpya-6532622b.e2b.dev`
- **Features**: 
  - Kitchen cabinet estimation with 4 quality tiers
  - Crown molding calculations
  - Material specifications (NO pricing)
  - Labor hour calculations
- **Example**: Kitchen renovation with soft-close cabinets

#### **Electrical API - Framework Ready**
- **Status**: 🏗️ Ready for Development
- **Specialization**: Wiring, Panels, Outlets, Lighting
- **Framework**: Complete template available
- **Features**:
  - Circuit calculations
  - Panel upgrades
  - Outlet installations
  - Lighting systems

#### **Plumbing API - Framework Ready**
- **Status**: 🏗️ Ready for Development  
- **Specialization**: Pipes, Fixtures, Water Systems
- **Framework**: Complete template available
- **Features**:
  - Pipe sizing and routing
  - Fixture installations
  - Water pressure calculations
  - Drain systems

#### **Painting API - Framework Ready**
- **Status**: 🏗️ Ready for Development
- **Specialization**: Interior/Exterior Surface Preparation
- **Framework**: Complete template available
- **Features**:
  - Surface area calculations
  - Primer and paint requirements
  - Labor time estimates
  - Quality tier specifications

#### **Flooring API - Framework Ready**
- **Status**: 🏗️ Ready for Development
- **Specialization**: Hardwood, Tile, Carpet Installation
- **Framework**: Complete template available
- **Features**:
  - Material calculations with waste factors
  - Subfloor preparation
  - Installation labor estimates
  - Transition strips and trim

#### **HVAC API - Framework Ready**
- **Status**: 🏗️ Ready for Development
- **Specialization**: Heating, Cooling, Ventilation Systems
- **Framework**: Complete template available
- **Features**:
  - System sizing calculations
  - Ductwork requirements
  - Equipment specifications
  - Installation estimates

---

## 🌐 **API DOCUMENTATION SECTION**

### **🚀 Quick Start**
Interactive code examples with copy buttons:

```bash
# Multi-Trade Estimation
curl -X POST https://8080-i0k34xlfbjev6sx7pzpya-6532622b.e2b.dev/api/estimates/multi-trade \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"description": "Kitchen renovation with cabinets"}'
```

### **🔑 Authentication Section**
- **API Key Required**: All endpoints except public ones
- **Header Format**: `X-API-Key: your_key_here` 
- **Rate Limits**: 
  - Production: 1,000 req/hour
  - Development: 500 req/hour
  - Demo: 100 req/hour
- **Get API Key Button**: Links to key generation

### **📊 Live API Explorer**
Interactive section with:
- **Endpoint Selector**: Dropdown with all available endpoints
- **Parameter Builder**: Form to build requests
- **Try It Now**: Execute real API calls
- **Response Viewer**: Pretty-printed JSON responses

---

## 💰 **User-Editable Pricing Section**

### **🚫 What We DON'T Provide**
- ❌ No hardcoded material costs
- ❌ No sample labor rates
- ❌ No fallback pricing estimates
- ❌ No pricing liability

### **✅ What We DO Provide**  
- ✅ Material specifications with quantities
- ✅ Labor hour calculations by skill level
- ✅ Quality tier indicators
- ✅ Waste factor calculations
- ✅ National average references (starting points)

### **📋 Example Response**
Show formatted JSON with pricing_required flags:
```json
{
  "item": "Upper Cabinet Boxes",
  "quantity": 14,
  "unit": "each",
  "pricing_required": true
}
```

---

## 🎯 **BUSINESS BENEFITS SECTION**

### **For Platform Owners**
- 🛡️ **Zero Pricing Liability**: Users control all costs
- ⚡ **Rapid Development**: Focus on specifications, not pricing
- 🌍 **Wide Adoption**: Works for any contractor, any region
- 🏆 **Professional Credibility**: Comprehensive trade expertise

### **For Contractors**
- 💰 **Full Pricing Control**: Maintain competitive advantage
- ⚡ **Speed**: Reference data as starting points
- 🎯 **Accuracy**: Detailed specifications and quantities  
- 🔧 **Flexibility**: Adjust for quality, market, relationships

### **For Clients**
- 📊 **Transparency**: Detailed line-item breakdowns
- 🎓 **Education**: Understand what work involves
- 💯 **Confidence**: Professional, comprehensive estimates

---

## 🔐 **API ACCESS SECTION**

### **Get Your API Key**
Contact form or button that provides:
- **Instant Demo Key**: For testing (100 req/hour)
- **Development Key**: For staging (500 req/hour) 
- **Production Key**: For live applications (1,000 req/hour)

### **Current API Keys** (Admin View)
```
Demo Key: fb_demo_68657471b5a684d79aed27f4a56c229b
Development Key: fb_dev_[truncated]...
Production Key: fb_prod_[truncated]...
```

---

## 📚 **DOCUMENTATION LINKS**

### **Technical Documentation**
- **Integration Guide**: Complete setup instructions
- **API Reference**: Full endpoint documentation  
- **Authentication**: Security and rate limiting
- **Error Handling**: Response codes and troubleshooting
- **GitHub Repository**: https://github.com/nasman1965/FireAPI

### **Business Documentation**
- **Pricing Strategy**: User-editable approach explanation
- **Trade Library**: Job templates and calculations
- **Microservices Architecture**: Technical overview
- **Contractor Benefits**: Business value proposition

---

## 🎨 **DESIGN SPECIFICATIONS**

### **Color Scheme**
- **Primary**: Fire/Construction Orange (#FF6B35)
- **Secondary**: Deep Blue (#1B365D) 
- **Accent**: Success Green (#28A745)
- **Warning**: Alert Orange (#FFC107)
- **Background**: Clean White/Light Gray

### **Typography**
- **Headers**: Bold, modern sans-serif
- **Body**: Clean, readable font
- **Code**: Monospace font for API examples
- **Status Indicators**: Clear icons (✅ 🏗️ ❌)

### **Components**
- **API Status Cards**: Show live/ready/development status
- **Code Blocks**: Syntax highlighted with copy buttons
- **Interactive Examples**: Live API testing interface
- **Responsive Design**: Mobile-friendly layout
- **Loading States**: For API calls and status checks

### **Interactive Elements**
- **Live API Health**: Real-time status indicators
- **Copy API Keys**: One-click copy buttons
- **Try API**: Interactive request builder
- **Endpoint Explorer**: Browse all available endpoints
- **Response Viewer**: Formatted JSON with syntax highlighting

---

## 🚀 **TECHNICAL IMPLEMENTATION**

### **Required Features**
- **React/Next.js**: Modern framework
- **API Integration**: Real calls to FireAPI endpoints
- **Syntax Highlighting**: For code examples
- **Responsive Design**: Mobile-first approach
- **SEO Optimization**: Meta tags and structure
- **Performance**: Fast loading and caching

### **API Endpoints to Integrate**
- **Root**: `GET /` (API information)
- **Health**: `GET /api/microservices/health`
- **Trades**: `GET /api/trades/available`
- **Demo Estimate**: `POST /api/estimates/multi-trade`
- **Admin Keys**: `GET /admin/api-keys` (for key display)

### **Environment Variables**
```
FIREAPI_BASE_URL=https://8080-i0k34xlfbjev6sx7pzpya-6532622b.e2b.dev
DEMO_API_KEY=fb_demo_68657471b5a684d79aed27f4a56c229b
```

---

## 🎯 **SUCCESS CRITERIA**

### **Functional Requirements**
- ✅ Professional landing page with clear value proposition
- ✅ Live API status and health monitoring
- ✅ Interactive API explorer with real requests
- ✅ Complete documentation with examples
- ✅ API key management and display
- ✅ Mobile-responsive design
- ✅ Fast performance and SEO optimization

### **User Experience Goals**
- 🎯 **Developers** can quickly understand and integrate
- 🎯 **Business users** understand the value proposition
- 🎯 **Contractors** see how pricing control benefits them
- 🎯 **Platform owners** understand zero liability approach

**🔥 Create a world-class API documentation site that showcases the FireAPI.dev construction intelligence platform!** 🚀