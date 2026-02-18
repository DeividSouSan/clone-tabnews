import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrationByName("1752772646510_create-users");
  await orchestrator.runPendingMigrationByName("1754759624163_create-sessions");
  await orchestrator.runPendingMigrationByName(
    "1765132073864_add-features-to-users"
  );
});

describe("GET to /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar essa ação.",
        action: `Verifique se o seu usuário possui a feature read:migrations.`,
        status_code: 403
      });
    });
  });

  describe("Authenticated user", () => {
    test("Retrieving pending migrations", async () => {
      const user = await orchestrator.createUserWithSession();
      await orchestrator.addFeaturesToUser(user, ["read:migrations"]);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${user.token}`
        }
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody.length).toBeGreaterThan(0);

      responseBody.forEach((migration) => {
        expect(migration.path).toBeDefined();
        expect(migration.name).toBeDefined();
        expect(migration.timestamp).toBeDefined();
      });
    });
  });
});

afterEach(async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  const responseBody = await response.json();
  if (responseBody.dependencies.database.opened_connections !== 1) {
    throw new Error(
      "Conexões que foram abertas não foram fechadas adequadamente."
    );
  }
});
