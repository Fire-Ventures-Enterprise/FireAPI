# 🔥 **LOVABLE PROMPT: Integrate FireAPI into FireBuild.AI Frontend**

## 🎯 **PROJECT REQUEST**

Integrate the FireAPI construction intelligence platform directly into the existing FireBuild.AI frontend. Add API key management, construction estimation tools, and developer resources as new features within the current application.

---

## 🚀 **INTEGRATION APPROACH**

### **📍 Add New Routes to Existing App**
```
/developer          → API developer dashboard
/api-keys          → API key management  
/estimation        → Construction estimation tools
/trades            → Trade-specific APIs showcase
/api-docs          → Interactive documentation
```

### **🔧 Environment Configuration**
Add to existing `.env` file:
```bash
# FireAPI Integration
NEXT_PUBLIC_FIREAPI_BASE_URL=https://8080-i0k34xlfbjev6sx7pzpya-6532622b.e2b.dev
NEXT_PUBLIC_FIREAPI_DEMO_KEY=fb_demo_68657471b5a684d79aed27f4a56c229b
FIREAPI_DEV_KEY=fb_dev_5ca45e43e6cde5d55f29382e83a71eddb4c71e51709ecd4f5f267c65c0a59a9d
FIREAPI_PROD_KEY=fb_prod_4ff496504b6a261c7a871fa08cbb47fd73709a4c43dcd0b4027ffd8019326138
```

---

## 🎪 **NEW NAVIGATION ITEMS**

### **📱 Add to Main Navigation**
```jsx
// Update existing navigation component
const navigationItems = [
  // ... existing items
  {
    name: 'Developer API',
    href: '/developer',
    icon: CodeBracketIcon,
    badge: 'New'
  },
  {
    name: 'Estimation Tools', 
    href: '/estimation',
    icon: CalculatorIcon
  }
];
```

### **🔧 Developer Dropdown Menu**
```jsx
<DropdownMenu>
  <DropdownMenuItem href="/developer">
    🔧 API Dashboard
  </DropdownMenuItem>
  <DropdownMenuItem href="/api-keys">
    🔑 API Keys
  </DropdownMenuItem>
  <DropdownMenuItem href="/api-docs">
    📚 Documentation
  </DropdownMenuItem>
  <DropdownMenuItem href="/trades">
    🎪 Trade APIs
  </DropdownMenuItem>
</DropdownMenu>
```

---

## 🔑 **API KEY MANAGEMENT PAGE**

### **📍 Route: `/api-keys`**

```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth'; // Existing FireBuild.AI auth

export default function APIKeysPage() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState(null);
  const [usage, setUsage] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔥 FireAPI Developer Keys
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access the construction intelligence API with secure authentication keys. 
            Generate estimates, manage trades, and integrate with your applications.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-green-800 font-medium">API Status: Live</span>
            </div>
          </div>
        </div>

        {/* API Keys Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Demo Key - Always Available */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  🎨
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Demo Key</h3>
                  <p className="text-sm text-gray-500">100 requests/hour</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                Public
              </span>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="flex items-center">
                <code className="flex-1 p-3 bg-gray-50 rounded-lg text-sm font-mono text-gray-800 border">
                  fb_demo_68657471b5a684d79aed27f4a56c229b
                </code>
                <button 
                  onClick={() => copyToClipboard('fb_demo_68657471b5a684d79aed27f4a56c229b')}
                  className="ml-2 p-2 text-gray-400 hover:text-gray-600"
                >
                  📋
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Permissions:</span>
                <span className="font-medium">estimates, health</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Usage Today:</span>
                <span className="font-medium">12 / 100</span>
              </div>
            </div>

            <button 
              onClick={() => testAPIKey('demo')}
              className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              🧪 Test API
            </button>
          </div>

          {/* Development Key - For Logged In Users */}
          <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  🔧
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Development Key</h3>
                  <p className="text-sm text-gray-500">500 requests/hour</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                Account Required
              </span>
            </div>

            {user ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <div className="flex items-center">
                    <code className="flex-1 p-3 bg-blue-50 rounded-lg text-sm font-mono text-gray-800 border">
                      fb_dev_5ca45e43e6cde5d55f29382e83a71eddb4c71e51709ecd4f5f267c65c0a59a9d
                    </code>
                    <button 
                      onClick={() => copyToClipboard('fb_dev_5ca45e43e6cde5d55f29382e83a71eddb4c71e51709ecd4f5f267c65c0a59a9d')}
                      className="ml-2 p-2 text-blue-400 hover:text-blue-600"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Permissions:</span>
                    <span className="font-medium">estimates, carpentry, orchestration, health</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Usage Today:</span>
                    <span className="font-medium">47 / 500</span>
                  </div>
                </div>

                <button 
                  onClick={() => testAPIKey('development')}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🧪 Test API
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Login required to access development key</p>
                <button 
                  onClick={() => signIn()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

          {/* Production Key - For Premium Users */}
          <div className="bg-white rounded-xl shadow-lg border border-orange-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  🚀
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Production Key</h3>
                  <p className="text-sm text-gray-500">1,000 requests/hour</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                Premium
              </span>
            </div>

            {user?.isPremium ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <div className="flex items-center">
                    <code className="flex-1 p-3 bg-orange-50 rounded-lg text-sm font-mono text-gray-800 border">
                      fb_prod_4ff496504b6a261c7a871fa08cbb47fd73709a4c43dcd0b4027ffd8019326138
                    </code>
                    <button 
                      onClick={() => copyToClipboard('fb_prod_4ff496504b6a261c7a871fa08cbb47fd73709a4c43dcd0b4027ffd8019326138')}
                      className="ml-2 p-2 text-orange-400 hover:text-orange-600"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Permissions:</span>
                    <span className="font-medium">Full Access</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Usage Today:</span>
                    <span className="font-medium">234 / 1,000</span>
                  </div>
                </div>

                <button 
                  onClick={() => testAPIKey('production')}
                  className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  🧪 Test API
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Upgrade to Premium for production access</p>
                <button 
                  onClick={() => upgradeToPremium()}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🚀 Quick Start</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">JavaScript/React</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <code className="text-green-400 text-sm">
{`// Multi-trade estimation
fetch('https://8080-i0k34xlfbjev6sx7pzpya-6532622b.e2b.dev/api/estimates/multi-trade', {
  method: 'POST',
  headers: {
    'X-API-Key': '${user?.isPremium ? 'fb_prod_...' : 'fb_demo_...'}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    description: 'Kitchen renovation with cabinets'
  })
})`}
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">cURL</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <code className="text-green-400 text-sm">
{`curl -X POST \\
  https://8080-i0k34xlfbjev6sx7pzpya-6532622b.e2b.dev/api/estimates/multi-trade \\
  -H "X-API-Key: ${user?.isPremium ? 'fb_prod_...' : 'fb_demo_...'}" \\
  -H "Content-Type: application/json" \\
  -d '{"description": "Kitchen renovation"}'`}
                </code>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <button 
              onClick={() => router.push('/api-docs')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📚 Full Documentation
            </button>
            <button 
              onClick={() => router.push('/estimation')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🏠 Try Estimation
            </button>
            <button 
              onClick={() => router.push('/trades')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              🎪 Browse Trade APIs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🏠 **CONSTRUCTION ESTIMATION PAGE**

### **📍 Route: `/estimation`**

```jsx
import { useState } from 'react';
import { FireAPIClient } from '@/lib/fireapi';

export default function EstimationPage() {
  const { user } = useAuth();
  const [projectDescription, setProjectDescription] = useState('');
  const [projectDetails, setProjectDetails] = useState({
    square_footage: '',
    location: { region: 'national' },
    quality_tier: 'mid_range'
  });
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateEstimate = async () => {
    setLoading(true);
    try {
      const apiKey = user?.isPremium ? 
        process.env.FIREAPI_PROD_KEY : 
        process.env.NEXT_PUBLIC_FIREAPI_DEMO_KEY;
      
      const client = new FireAPIClient(apiKey);
      const result = await client.getMultiTradeEstimate(
        projectDescription, 
        projectDetails
      );
      
      setEstimate(result);
    } catch (error) {
      console.error('Estimation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏠 Construction Estimation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get detailed construction estimates using AI-powered natural language processing. 
            Describe your project and get comprehensive material and labor breakdowns.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Input Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📝 Project Details</h2>
            
            {/* Project Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe your construction project in natural language..."
                rows={4}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              
              {/* Example Buttons */}
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Try these examples:</p>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setProjectDescription("Kitchen renovation with new cabinets, crown molding, and soft close hardware. Medium sized kitchen with mid-range quality.")}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition-colors"
                  >
                    🏠 Kitchen Renovation
                  </button>
                  <button 
                    onClick={() => setProjectDescription("Bathroom remodel with new plumbing fixtures and electrical outlets")}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    🚿 Bathroom Remodel
                  </button>
                  <button 
                    onClick={() => setProjectDescription("Basement finishing with framing, electrical, and flooring")}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
                  >
                    🏗️ Basement Finish
                  </button>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Square Footage (Optional)
                </label>
                <input
                  type="number"
                  value={projectDetails.square_footage}
                  onChange={(e) => setProjectDetails(prev => ({
                    ...prev,
                    square_footage: e.target.value
                  }))}
                  placeholder="e.g. 180"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Level
                </label>
                <select
                  value={projectDetails.quality_tier}
                  onChange={(e) => setProjectDetails(prev => ({
                    ...prev,
                    quality_tier: e.target.value
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="budget">Budget - Basic materials</option>
                  <option value="mid_range">Mid-Range - Standard quality</option>
                  <option value="high_end">High-End - Premium materials</option>
                  <option value="luxury">Luxury - Top tier finishes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <select
                  value={projectDetails.location.region}
                  onChange={(e) => setProjectDetails(prev => ({
                    ...prev,
                    location: { region: e.target.value }
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="national">National Average</option>
                  <option value="northeast">Northeast</option>
                  <option value="southeast">Southeast</option>
                  <option value="midwest">Midwest</option>
                  <option value="southwest">Southwest</option>
                  <option value="west">West Coast</option>
                </select>
              </div>
            </div>

            <button
              onClick={generateEstimate}
              disabled={!projectDescription || loading}
              className="w-full mt-6 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating Estimate...
                </div>
              ) : (
                '🚀 Generate Estimate'
              )}
            </button>

            {/* API Key Info */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Using {user?.isPremium ? 'Production' : 'Demo'} API Key
                {!user?.isPremium && (
                  <button 
                    onClick={() => router.push('/api-keys')}
                    className="ml-2 text-orange-600 hover:text-orange-700 underline"
                  >
                    Upgrade for more requests
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Estimate Results</h2>
            
            {!estimate && !loading && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🏗️</div>
                <p>Enter project details and click "Generate Estimate" to see results</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing project and generating estimate...</p>
              </div>
            )}

            {estimate && (
              <EstimateResults estimate={estimate} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Estimate Results Component
function EstimateResults({ estimate }) {
  return (
    <div className="space-y-6">
      {/* Project Summary */}
      <div className="bg-orange-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Project Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Type:</span>
            <span className="ml-2 font-medium">{estimate.data.project.description}</span>
          </div>
          <div>
            <span className="text-gray-600">Size:</span>
            <span className="ml-2 font-medium">{estimate.data.project.size}</span>
          </div>
          <div>
            <span className="text-gray-600">Quality:</span>
            <span className="ml-2 font-medium">{estimate.data.project.quality_tier}</span>
          </div>
          <div>
            <span className="text-gray-600">Trades:</span>
            <span className="ml-2 font-medium">{estimate.data.project.trades_involved.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⏰ Timeline</h3>
        <div className="flex items-center">
          <div className="text-2xl font-bold text-blue-600">
            {estimate.data.schedule.total_timeline_days}
          </div>
          <div className="ml-2 text-gray-600">days estimated</div>
        </div>
        
        {/* Trade Schedule */}
        <div className="mt-4 space-y-2">
          {estimate.data.schedule.by_trade.map((trade, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="capitalize">{trade.trade}:</span>
              <span>Day {trade.start_day}-{trade.end_day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trade Estimates */}
      {estimate.data.estimates.by_trade.map((trade, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 capitalize">
              🔨 {trade.trade} Work
            </h3>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {trade.labor_hours} hours
              </div>
              <div className="text-sm text-gray-600">estimated labor</div>
            </div>
          </div>

          {/* Phases */}
          <div className="space-y-4">
            {trade.phases.map((phase, phaseIndex) => (
              <div key={phaseIndex} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">{phase.phase}</h4>
                
                {/* Tasks */}
                <div className="space-y-3">
                  {phase.tasks.map((task, taskIndex) => (
                    <div key={taskIndex} className="border-l-4 border-orange-200 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-800">{task.task}</span>
                        <span className="text-sm text-gray-600">{task.hours}h</span>
                      </div>
                      
                      {/* Materials */}
                      {task.materials.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 mb-1">Materials:</p>
                          <div className="space-y-1">
                            {task.materials.map((material, matIndex) => (
                              <div key={matIndex} className="text-sm text-gray-600 flex justify-between">
                                <span>{material.item}</span>
                                <span>{material.quantity} {material.unit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Pricing Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="text-yellow-600 mr-3">💰</div>
          <div>
            <h3 className="font-medium text-yellow-800 mb-2">User-Editable Pricing</h3>
            <p className="text-yellow-700 text-sm">
              This estimate provides material specifications and labor hours only. 
              You maintain complete control over pricing based on your local market, 
              supplier relationships, and profit margins.
            </p>
            <button className="mt-2 text-yellow-800 underline text-sm hover:text-yellow-900">
              Learn more about our pricing strategy →
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
          📧 Email Estimate
        </button>
        <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          💾 Save to Projects
        </button>
        <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          🔗 Share Link
        </button>
      </div>
    </div>
  );
}
```

---

## 🎪 **TRADE APIS SHOWCASE PAGE**

### **📍 Route: `/trades`**

```jsx
export default function TradeAPIsPage() {
  const [selectedTrade, setSelectedTrade] = useState('carpentry');
  const [apiStatus, setApiStatus] = useState(null);

  const tradeAPIs = [
    {
      id: 'carpentry',
      name: 'Carpentry API',
      icon: '🔨',
      status: 'live',
      description: 'Kitchen cabinets, trim, framing, and door installation',
      specializations: [
        'Kitchen Cabinets (4 quality tiers)',
        'Crown Molding & Trim Work',
        'Door & Window Installation',
        'Framing & Structural Work'
      ],
      endpoints: [
        'POST /api/carpentry/cabinets',
        'POST /api/estimates/single-trade/carpentry'
      ],
      sampleRequest: {
        request_id: "firebuild_001",
        project: { size: "medium", quality_tier: "mid_range" },
        trade_scope: {
          specific_requirements: ["upper_cabinets", "lower_cabinets", "crown_molding"]
        }
      }
    },
    {
      id: 'electrical',
      name: 'Electrical API', 
      icon: '⚡',
      status: 'framework',
      description: 'Wiring, panels, outlets, and lighting systems',
      specializations: [
        'Circuit Calculations & Load Analysis',
        'Panel Upgrades & Service Changes',
        'Outlet & Switch Installation',
        'Lighting System Design'
      ],
      comingSoon: true
    },
    {
      id: 'plumbing',
      name: 'Plumbing API',
      icon: '🚿', 
      status: 'framework',
      description: 'Pipes, fixtures, and water systems',
      specializations: [
        'Pipe Sizing & Routing',
        'Fixture Installation',
        'Water Pressure Calculations',
        'Drain & Vent Systems'
      ],
      comingSoon: true
    },
    // ... more trades
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎪 Construction Trade APIs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Specialized microservices for every construction trade. 
            Get detailed estimates with material specifications and labor calculations.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            🏗️ Microservices Architecture
          </h2>
          
          <div className="flex flex-col items-center">
            {/* Orchestrator */}
            <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-xl p-6 mb-8 shadow-lg">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">🎪 Main Orchestrator</h3>
                <p className="text-orange-100">Multi-trade coordination & natural language processing</p>
              </div>
            </div>

            {/* Connection Lines */}
            <div className="w-px h-12 bg-gray-300 mb-8"></div>

            {/* Trade APIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
              {tradeAPIs.map((trade) => (
                <div 
                  key={trade.id}
                  onClick={() => setSelectedTrade(trade.id)}
                  className={`
                    bg-white rounded-lg p-6 border-2 cursor-pointer transition-all duration-200
                    ${selectedTrade === trade.id ? 'border-orange-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}
                    ${trade.status === 'live' ? 'ring-2 ring-green-200' : ''}
                  `}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">{trade.icon}</div>
                    <h3 className="font-bold text-gray-900 mb-2">{trade.name}</h3>
                    <div className="mb-3">
                      {trade.status === 'live' ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          ✅ Production Ready
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          🏗️ Framework Ready
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{trade.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Trade Details */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <TradeDetails trade={tradeAPIs.find(t => t.id === selectedTrade)} />
        </div>
      </div>
    </div>
  );
}

function TradeDetails({ trade }) {
  if (!trade) return null;

  return (
    <div>
      <div className="flex items-center mb-6">
        <div className="text-6xl mr-6">{trade.icon}</div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{trade.name}</h2>
          <p className="text-lg text-gray-600">{trade.description}</p>
          <div className="mt-2">
            {trade.status === 'live' ? (
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ✅ Production Ready - Available Now
              </span>
            ) : (
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                🏗️ Framework Ready - Coming Soon
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Specializations */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Specializations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trade.specializations.map((spec, index) => (
            <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-orange-600 font-bold text-sm">{index + 1}</span>
              </div>
              <span className="text-gray-800">{spec}</span>
            </div>
          ))}
        </div>
      </div>

      {trade.status === 'live' ? (
        <>
          {/* API Endpoints */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🔗 API Endpoints</h3>
            <div className="space-y-2">
              {trade.endpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-900 rounded-lg">
                  <span className="text-green-400 font-mono text-sm">{endpoint}</span>
                  <button className="ml-auto text-gray-400 hover:text-white">
                    📋
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Request */}
          {trade.sampleRequest && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📝 Sample Request</h3>
              <div className="bg-gray-900 rounded-lg p-4">
                <code className="text-green-400 text-sm">
                  <pre>{JSON.stringify(trade.sampleRequest, null, 2)}</pre>
                </code>
              </div>
            </div>
          )}

          {/* Try It Button */}
          <div className="text-center">
            <button 
              onClick={() => router.push(`/estimation?trade=${trade.id}`)}
              className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-lg"
            >
              🧪 Try {trade.name}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏗️</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon!</h3>
          <p className="text-lg text-gray-600 mb-6">
            The {trade.name} is built on our standardized microservices framework and ready for development.
          </p>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="font-bold text-blue-900 mb-2">🔧 Framework Features Ready:</h4>
              <ul className="text-blue-800 text-left space-y-1">
                <li>✅ Standardized API structure</li>
                <li>✅ Authentication & rate limiting</li>
                <li>✅ Error handling & validation</li>
                <li>✅ Material specification format</li>
                <li>✅ Labor calculation framework</li>
              </ul>
            </div>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              📧 Notify Me When Available
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 **UTILITY COMPONENTS & SERVICES**

### **🌐 FireAPI Client Service**
```javascript
// lib/fireapi.js
export class FireAPIClient {
  constructor(apiKey) {
    this.baseURL = process.env.NEXT_PUBLIC_FIREAPI_BASE_URL;
    this.apiKey = apiKey;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`FireAPI Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getMultiTradeEstimate(description, projectDetails) {
    return this.request('/api/estimates/multi-trade', {
      method: 'POST',
      body: JSON.stringify({ 
        description, 
        project_details: projectDetails 
      })
    });
  }

  async getCabinetEstimate(projectData) {
    return this.request('/api/carpentry/cabinets', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  }

  async getAvailableTrades() {
    return this.request('/api/trades/available');
  }

  async getHealth() {
    return this.request('/api/microservices/health');
  }
}
```

### **🔄 React Hooks**
```javascript
// hooks/useFireAPI.js
import { useState, useEffect } from 'react';
import { FireAPIClient } from '@/lib/fireapi';
import { useAuth } from './useAuth';

export function useFireAPI() {
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const apiKey = user?.isPremium ? 
      process.env.FIREAPI_PROD_KEY : 
      process.env.NEXT_PUBLIC_FIREAPI_DEMO_KEY;
    
    setClient(new FireAPIClient(apiKey));
  }, [user]);

  const checkHealth = async () => {
    if (!client) return;
    try {
      const result = await client.getHealth();
      setHealth(result);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  return {
    client,
    health,
    checkHealth,
    isReady: !!client
  };
}
```

---

## 📱 **MOBILE RESPONSIVENESS**

### **🎨 Responsive Design Patterns**
```jsx
// Mobile-first approach for all components
<div className="
  grid grid-cols-1 
  sm:grid-cols-2 
  lg:grid-cols-3 
  xl:grid-cols-4 
  gap-4 sm:gap-6
">
  {/* API Key Cards */}
</div>

// Stack on mobile, side-by-side on desktop
<div className="
  flex flex-col 
  lg:flex-row 
  gap-6 lg:gap-8
">
  <div className="flex-1">{/* Input */}</div>
  <div className="flex-1">{/* Results */}</div>
</div>

// Hide/show elements based on screen size
<div className="
  hidden sm:block 
  lg:hidden xl:block
">
  {/* Conditional content */}
</div>
```

---

## 🎯 **SUCCESS CRITERIA**

### **✅ Integration Requirements**
- ✅ **Seamless UX**: Feels native to existing FireBuild.AI app
- ✅ **User Authentication**: Leverages existing FireBuild.AI auth system
- ✅ **API Key Management**: Tiered access (Demo/Development/Production)
- ✅ **Live Estimation**: Working construction estimates with real API calls
- ✅ **Trade Showcase**: Display all 6 trade APIs with status indicators
- ✅ **Mobile Responsive**: Works perfectly on all device sizes
- ✅ **Error Handling**: Graceful handling of API errors and edge cases

### **🚀 Business Value**
- 🎯 **Existing Users**: Get immediate access to construction estimation
- 🎯 **Developers**: Easy API key access and interactive documentation
- 🎯 **Premium Upsell**: Production keys drive subscription upgrades
- 🎯 **Platform Growth**: Single destination for all FireBuild.AI services

**🔥 Transform FireBuild.AI into a comprehensive construction intelligence platform with integrated API access and estimation tools!** 🚀