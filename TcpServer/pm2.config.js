module.exports = {
    name: "TcpServer", // Name of your application
    script: "index.ts", // Entry point of your application
    interpreter: "~/.bun/bin/bun", // Path to the Bun interpreter
    out_file: '../logs/client_prod_out',
    error_file: '../logs/client_prod_error',
    combine_logs: 'false',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  };