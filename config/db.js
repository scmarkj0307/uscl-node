require('dotenv').config();

const sql = require('mssql');

const config = {
  user: process.env.DB_USER,    
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    instanceName: process.env.DB_INSTANCE,  //use instance or port depends on your sql server connection
    encrypt: false,
    trustServerCertificate: true
  }
};

sql.connect(config).catch(err => console.error('DB Connection Failed:', err));

module.exports = { sql, config };
