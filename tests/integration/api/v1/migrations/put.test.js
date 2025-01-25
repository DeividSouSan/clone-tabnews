import database from 'infra/database.js';

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;")
}

beforeAll(() => {
  return cleanDatabase();
});

test("PUT to /api/v1/migrations should return 405", async () => {
  const response1 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "PUT"
  });
  expect(response1.status).toBe(405);

  const response2 = await fetch("http://localhost:3000/api/v1/status");
  const response2Body = await response2.json();
  console.log(response2Body);
  expect(response2Body.dependencies.database.opened_connections).toEqual(1);
})
