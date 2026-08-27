module.exports = {
  apps: [
    {
      name: 'kiara-medicals-api',
      script: 'server/src/server.js',
      instances: 'max', // Utilizes all available CPU cores in cluster mode
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      combine_logs: true,
      merge_logs: true,
      kill_timeout: 5000,
      listen_timeout: 8000,
    },
  ],
};
