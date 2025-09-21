# 🔑 **FireBuild.AI API Keys - READY FOR INTEGRATION**

## 🎯 **API Endpoint**
```
🌐 Production API: https://8080-i0k34xlfbjev6sx7pzpya-6532622b.e2b.dev
🔐 Authentication: Required (API Key in X-API-Key header)
📚 Documentation: Available at all endpoints
```

---

## 🔑 **API KEYS FOR FIREBUILD.AI**

### **🚀 PRODUCTION KEY**
```
Key: fb_prod_4ff496504b6a261c7a871fa08cbb47fd73709a4c43dcd0b4027ffd8019326138
Name: FireBuild.AI Production
Rate Limit: 1,000 requests/hour
Permissions: estimates, carpentry, orchestration, health
Domains: firebuild.ai, *.firebuild.ai, *.e2b.dev
```

### **🔧 DEVELOPMENT KEY** 
```
Key: fb_dev_5ca45e43e6cde5d55f29382e83a71eddb4c71e51709ecd4f5f267c65c0a59a9d
Name: FireBuild.AI Development  
Rate Limit: 500 requests/hour
Permissions: estimates, carpentry, orchestration, health
Domains: localhost, dev.firebuild.ai, staging.firebuild.ai
```

### **🎨 DEMO KEY**
```
Key: fb_demo_68657471b5a684d79aed27f4a56c229b
Name: FireBuild.AI Demo
Rate Limit: 100 requests/hour  
Permissions: estimates, health
Domains: * (any domain)
```

---

## 🌐 **INTEGRATION EXAMPLES**

### **🏠 Multi-Trade Estimation**
```bash
curl -X POST https://8080-i0k34xlfbjev6sx7pzpya-6532622b.e2b.dev/api/estimates/multi-trade \
  -H "X-API-Key: fb_prod_4ff496504b6a261c7a871fa08cbb47fd73709a4c43dcd0b4027ffd8019326138" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Kitchen renovation with new cabinets and crown molding", 
    "project_details": {
      "square_footage": 180,
      "location": {"region": "northeast"}
    }
  }'
```

### **🔨 Kitchen Cabinet Specialization**
```bash
curl -X POST https://8080-i0k34xlfbjev6sx7pzpya-6532622b.e2b.dev/api/carpentry/cabinets \
  -H "X-API-Key: fb_prod_4ff496504b6a261c7a871fa08cbb47fd73709a4c43dcd0b4027ffd8019326138" \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "firebuild_001",
    "project": {"size": "medium", "quality_tier": "mid_range"},
    "trade_scope": {
      "specific_requirements": ["upper_cabinets", "lower_cabinets", "crown_molding"]
    }
  }'
```

### **🔍 Service Discovery**
```bash
curl -H "X-API-Key: fb_prod_4ff496504b6a261c7a871fa08cbb47fd73709a4c43dcd0b4027ffd8019326138" \
  https://8080-i0k34xlfbjev6sx7pzpya-6532622b.e2b.dev/api/trades/available
```

### **❤️ Health Check**
```bash
curl -H "X-API-Key: fb_prod_4ff496504b6a261c7a871fa08cbb47fd73709a4c43dcd0b4027ffd8019326138" \
  https://8080-i0k34xlfbjev6sx7pzpya-6532622b.e2b.dev/api/microservices/health
```

---

## 🔐 **AUTHENTICATION METHODS**

### **✅ Recommended: X-API-Key Header**
```javascript
fetch('/api/estimates/multi-trade', {
  method: 'POST',
  headers: {
    'X-API-Key': 'fb_prod_4ff496504b6a261c7a871fa08cbb47fd73709a4c43dcd0b4027ffd8019326138',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    description: 'Kitchen renovation'
  })
})
```

### **✅ Alternative: Authorization Bearer**
```javascript
headers: {
  'Authorization': 'Bearer fb_prod_4ff496504b6a261c7a871fa08cbb47fd73709a4c43dcd0b4027ffd8019326138',
  'Content-Type': 'application/json'
}
```

### **✅ Alternative: Query Parameter** 
```javascript
const url = '/api/estimates/multi-trade?api_key=fb_prod_4ff496504b6a261c7a871fa08cbb47fd73709a4c43dcd0b4027ffd8019326138'
```

---

## 🚨 **ERROR RESPONSES**

### **🚫 Missing API Key**
```json
{
  "success": false,
  "error": {
    "code": "MISSING_API_KEY",
    "message": "API key is required. Please provide your API key in the X-API-Key header.",
    "documentation": "https://github.com/nasman1965/FireAPI"
  }
}
```

### **🚫 Invalid API Key**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY", 
    "message": "Invalid API key provided.",
    "hint": "Please check your API key and try again."
  }
}
```

### **🚫 Rate Limit Exceeded**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded for API key. 995 requests remaining.",
    "resetTime": "2025-09-21T22:56:33.000Z",
    "limit": 1000
  }
}
```

---

## 📊 **RATE LIMITS & MONITORING**

### **📈 Current Usage**
```bash
# Get usage statistics (admin endpoint)
curl https://8080-i0k34xlfbjev6sx7pzpya-6532622b.e2b.dev/admin/api-keys
```

### **⏱️ Rate Limit Details**
- **Production**: 1,000 requests/hour (83.3 req/min)
- **Development**: 500 requests/hour (8.3 req/min) 
- **Demo**: 100 requests/hour (1.7 req/min)
- **Reset Window**: Every hour from first request
- **Headers**: Rate limit info included in responses

---

## 🎯 **READY FOR FIREBUILD.AI INTEGRATION**

### ✅ **What's Ready:**
- **Secure Authentication**: API keys generated and tested
- **Rate Limiting**: Production-grade limits implemented  
- **Error Handling**: Comprehensive error responses
- **CORS Configuration**: firebuild.ai domains authorized
- **Full API Functionality**: All endpoints working with auth
- **Documentation**: Complete integration guide available

### 🚀 **Next Steps for FireBuild.AI:**
1. **Use Production Key**: `fb_prod_4ff496504b6a261c7a871fa08cbb47fd73709a4c43dcd0b4027ffd8019326138`
2. **Add X-API-Key Header**: Include in all API requests
3. **Test Endpoints**: Start with `/api/estimates/multi-trade`
4. **Handle Rate Limits**: Monitor usage and implement caching
5. **Error Handling**: Handle auth errors gracefully

**🔥 The API is production-ready with secure authentication for FireBuild.AI!** 🚀