// Migration runner: applies all .sql files in api/src/db/migrations/ in order.
// Usage: node scripts/migrate.js
// Requires DATABASE_URL environment variable.

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const migrationsDir = path.join(__dirname, '..', 'src', 'db', 'migrations');
  const sqlFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Running ${sqlFiles.length} migration(s) from ${migrationsDir}`);

  for (const file of sqlFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`  Applying: ${file}`);
    await client.query(sql);
  }

  await client.end();
  console.log('Migrations complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
