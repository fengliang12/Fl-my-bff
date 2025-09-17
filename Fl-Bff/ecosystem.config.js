// pm2.config.js
module.exports = {
  apps: [
    {
      name: "yd-app",
      script: "cmd.exe",
      args: "/c npm run dev",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: true,
      env: {
        NODE_ENV: "development",
        TS_NODE_PROJECT: "./tsconfig.json",
      },
      env_production: {
        NODE_ENV: "production",
        TS_NODE_PROJECT: "./tsconfig.json",
      },
      error_file: "./logs/yd-app-error.log",
      out_file: "./logs/yd-app-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
