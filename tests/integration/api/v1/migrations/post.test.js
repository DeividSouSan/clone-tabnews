import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrationByName("1752772646510_create-users");
  await orchestrator.runPendingMigrationByName("1754759624163_create-sessions");
  await orchestrator.runPendingMigrationByName(
    "1765132073864_add-features-to-users",
  );
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          },
        );

        expect(response.status).toBe(403);

        const responseBody = await response.json();

        expect(responseBody).toEqual({
          name: "ForbiddenError",
          message: "Você não possui permissão para executar essa ação.",
          action: `Verifique se o seu usuário possui a feature run:migrations.`,
          status_code: 403,
        });
      });
    });
  });

  describe("Authenticated user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const user = await orchestrator.createUserWithSession();
        await orchestrator.addFeaturesToUser(user, ["run:migrations"]);

        const response1 = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
            headers: {
              Cookie: `session_id=${user.token}`,
            },
          },
        );

        expect(response1.status).toBe(201);

        const response1Body = await response1.json();
        expect(Array.isArray(response1Body)).toBe(true);
        expect(response1Body.length).toBeGreaterThan(0);
      });

      test("For the second time", async () => {
        const user = await orchestrator.createUserWithSession();
        await orchestrator.addFeaturesToUser(user, ["run:migrations"]);

        const response2 = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
            headers: {
              Cookie: `session_id=${user.token}`,
            },
          },
        );

        expect(response2.status).toBe(200);

        const response2Body = await response2.json();
        expect(Array.isArray(response2Body)).toBe(true);
        expect(response2Body.length).toEqual(0);
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
});
