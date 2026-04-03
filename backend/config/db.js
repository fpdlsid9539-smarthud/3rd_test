const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST  ||"localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // ⭐ 여기 추가
  timezone: "+09:00",
  dateStrings: true,

  // Keep connections alive — prevents ECONNRESET on idle connections
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  // Timeouts
  connectTimeout: 10000,
  idleTimeout: 60000,
});

db.getConnection((err, conn) => {
  if (err) {
    console.error("DB 연결 실패:", err.message);
  } else {
    console.log("DB 연결 성공 (Connection Pool 준비 완료)");
    conn.release();
  }
});

setInterval(() => {
  db.query("SELECT 1", (err) => {
    if (err) console.error("DB keepalive 실패:", err.message);
  });
}, 5 * 60 * 1000);

module.exports = db; 