const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const migrate = require('../migrate'); // миграция в корне server

dotenv.config({ path: path.join(__dirname, '..', '.env.test') });

const testDb = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true  // включаем поддержку нескольких запросов в одном запросе
});

async function resetDatabase() {
  // Удаляем и создаём базу данных заново
  const adminDb = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || ''
  });

  await adminDb.query(`DROP DATABASE IF EXISTS \`${process.env.DB_NAME}\``);
  await adminDb.query(`CREATE DATABASE \`${process.env.DB_NAME}\``);
  await adminDb.end();

  // Применяем миграции (теперь база пустая, все таблицы создадутся с новой схемой)
  await migrate();
  console.log('✅ Тестовая БД пересоздана');
}

module.exports = {
  testDb,
  resetDatabase
};