import database from "infra/database.js";

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

beforeAll(() => {
  return cleanDatabase();
});

test("PUT to /api/v1/migrations should return 405", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "PUT",
  });

  expect(response.status).toBe(405);

  const responseBody = await response.json();
  expect(responseBody.error).toBe("Method PUT Not Allowed.");
});

afterEach(async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  const responseBody = await response.json();
  expect(responseBody.dependencies.database.opened_connections).toEqual(1);
});
