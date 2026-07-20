const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.iswuzfsaayfvuhwiumqb:0OGceST6hacKDf07@aws-0-us-west-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log('✅ Conexión exitosa a la nueva base de datos!');
    return client.query('SELECT version()');
  })
  .then(res => {
    console.log('PostgreSQL version:', res.rows[0].version);
    client.end();
  })
  .catch(err => {
    console.error('❌ Error de conexión:', err.message);
    client.end();
  });
