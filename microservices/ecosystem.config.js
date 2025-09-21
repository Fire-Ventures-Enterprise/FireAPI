/**
 * 🚀 PM2 Ecosystem Configuration
 * Manages all microservices with PM2 process manager
 */

module.exports = {
  apps: [
    {
      name: 'main-orchestrator',
      script: '../app.js', // Your existing main API
      cwd: '/home/user/webapp',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Trade service URLs
        CARPENTRY_API_URL: 'http://localhost:3001',
        ELECTRICAL_API_URL: 'http://localhost:3002',
        PLUMBING_API_URL: 'http://localhost:3003',
        PAINTING_API_URL: 'http://localhost:3004',
        FLOORING_API_URL: 'http://localhost:3005'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      error_file: '/home/user/webapp/logs/main-orchestrator-error.log',
      out_file: '/home/user/webapp/logs/main-orchestrator-out.log',
      log_file: '/home/user/webapp/logs/main-orchestrator.log'
    },
    
    {
      name: 'carpentry-api',
      script: 'server.js',
      cwd: '/home/user/webapp/microservices/carpentry-api',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      error_file: '/home/user/webapp/logs/carpentry-api-error.log',
      out_file: '/home/user/webapp/logs/carpentry-api-out.log',
      log_file: '/home/user/webapp/logs/carpentry-api.log'
    },

    {
      name: 'electrical-api',
      script: 'server.js',
      cwd: '/home/user/webapp/microservices/electrical-api',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      error_file: '/home/user/webapp/logs/electrical-api-error.log',
      out_file: '/home/user/webapp/logs/electrical-api-out.log',
      log_file: '/home/user/webapp/logs/electrical-api.log',
      // Start after dependencies are installed
      wait_ready: true,
      listen_timeout: 10000
    },

    {
      name: 'plumbing-api',
      script: 'server.js', 
      cwd: '/home/user/webapp/microservices/plumbing-api',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3003
      },
      error_file: '/home/user/webapp/logs/plumbing-api-error.log',
      out_file: '/home/user/webapp/logs/plumbing-api-out.log',
      log_file: '/home/user/webapp/logs/plumbing-api.log',
      wait_ready: true,
      listen_timeout: 10000
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: ['fireapi.dev'],
      ref: 'origin/main',
      repo: 'https://github.com/nasman1965/FireAPI.git',
      path: '/var/www/fireapi',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};