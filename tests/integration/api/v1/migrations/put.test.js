import database from "infra/database.js";

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

beforeAll(() => {
  return cleanDatabase();
});

describe("PUT /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Forbid user from updating data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "PUT",
      });

      expect(response.status).toBe(405);

      const responseBody = await response.json();
      expect(responseBody.error).toBe("Method PUT Not Allowed.");
    });
  });
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
