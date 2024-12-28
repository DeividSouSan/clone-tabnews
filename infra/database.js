import { Client } from 'pg';

async function query(queryObject) {
  const client = new Client({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB
  });

  await client.connect();
  const result = await client.query(queryObject);
  await client.end();

  return result;
}

export default {
  query,
};