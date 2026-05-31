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
  queueLimit: 0
});

async function resetDatabase() {
  const connection = await testDb.getConnection();
  try {
    // Отключаем проверку внешних ключей
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Получаем список всех таблиц в тестовой БД
    const [tables] = await connection.query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = ?',
      [process.env.DB_NAME]
    );

    // Удаляем все таблицы
    for (const table of tables) {
      await connection.query(`DROP TABLE IF EXISTS \`${table.table_name}\``);
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Все таблицы удалены из тестовой БД');

    // Применяем миграции заново (migrate.js уже использует .env.test)
    await migrate();
    console.log('✅ Тестовая БД пересоздана');
  } catch (error) {
    console.error('Ошибка при очистке тестовой БД:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  testDb,
  resetDatabase
};