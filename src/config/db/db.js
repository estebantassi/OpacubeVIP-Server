const { Pool } = require('pg');

const db = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE,
  port: process.env.SQL_PORT,
});

module.exports = db;