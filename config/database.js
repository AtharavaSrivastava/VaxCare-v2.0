const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vaxcare_db',
  user: process.env.DB_USER || 'vaxcare_user',
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Helper function to execute queries
const query = async (text, params = [], userId = null) => {
  const start = Date.now();

  const client = await pool.connect();

try {
  // Set current user id for audit triggers (if available)
  if (userId) {
    try {
      await client.query(
        "SELECT set_config('app.current_user_id', $1, true)",
        [userId]
      );
    } catch (err) {
      // Ignore if PostgreSQL doesn't support this custom parameter
    }
  }

  const res = await client.query(text, params);
  const duration = Date.now() - start;

  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;

} catch (error) {
  console.error('Database query error:', error);
  throw error;

} finally {
  client.release();
}
};

// Helper function for transactions
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  transaction
};
