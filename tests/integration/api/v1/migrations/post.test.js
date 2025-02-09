import database from "infra/database";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await database.query("drop schema public cascade; create schema public;");
});

test("POST to /api/v1/migrations should return 200", async () => {
  const response1 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });

  expect(response1.status).toBe(201);

  const response1Body = await response1.json();
  expect(Array.isArray(response1Body)).toBe(true);
  expect(response1Body.length).toBeGreaterThan(0);

  const response2 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });

  expect(response2.status).toBe(200);

  const response2Body = await response2.json();
  expect(Array.isArray(response2Body)).toBe(true);
  expect(response2Body.length).toEqual(0);
});

afterEach(async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  const responseBody = await response.json();
  if (responseBody.dependencies.database.opened_connections !== 1) {
    throw new Error(
      "Conexões que foram abertas não foram fechadas adequadamente.",
    );
  }
});
