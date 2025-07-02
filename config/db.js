require('dotenv').config();

const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    port: parseInt(process.env.DB_PORT, 10),
    encrypt: false,
    trustServerCertificate: true
  }
};

sql.connect(config).catch(err => console.error('DB Connection Failed:', err));

module.exports = { sql, config };
