const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'lms_db',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
  queueLimit: 0,
  connectTimeout: 10000,
  charset: 'utf8mb4',
  typeCast: (field, next) => {
    // Kembalikan DECIMAL/FLOAT sebagai number bukan string untuk perhitungan yang akurat
    if (field.type === 'DECIMAL' || field.type === 'NEWDECIMAL') {
      const val = field.string();
      return val === null ? null : parseFloat(val);
    }
    return next();
  },
});

module.exports = pool;
