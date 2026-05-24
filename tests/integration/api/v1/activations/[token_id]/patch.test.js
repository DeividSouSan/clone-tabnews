import { version as uuidVersion } from "uuid";
import activation from "models/activation";
import orchestrator from "tests/orchestrator";
import user from "models/user";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH to /api/v1/activations/[token_id]", () => {
  describe("Authenticated user", () => {
    test("With valid token associated with already activated user", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const activationToken = activation.createToken(createdUser.id);

      const sessionObject = await orchestrator.createSession(createdUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${sessionObject.token}`
          }
        }
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar essa ação.",
        action:
          "Verifique se o seu usuário possui a feature read:activation_token.",
        status_code: 403
      });
    });

    test("With valid token associated with other unactivated user", async () => {
      const user1 = await orchestrator.createUser();
      await activation.activateUserById(user1.id);
      const user1Cookie = await orchestrator.createSession(user1);

      const user2 = await orchestrator.createUser();
      const user2ActivationToken = await activation.createToken(user2.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${user2ActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${user1Cookie.token}`
          }
        }
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar essa ação.",
        action:
          "Verifique se o seu usuário possui a feature read:activation_token.",
        status_code: 403
      });
    });
  });

  describe("Anonymous user", () => {
    test("With nonexistent activation token", async () => {
      const fakeActivationToken = orchestrator.createUUID();

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${fakeActivationToken}`,
        {
          method: "PATCH"
        }
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
        status_code: 404
      });
    });

    test("With expired activation token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILLISECONDS)
      });

      const createdUser = await orchestrator.createUser({
        username: "ExpiredActivationToken",
        email: "expired.activation.token@curso.dev",
        password: "ExpiredActivationToken"
      });
      const activationToken = await activation.createToken(createdUser.id);

      jest.useRealTimers();

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        { method: "PATCH" }
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
        status_code: 404
      });
    });

    test("Already used activation token", async () => {
      const createdUser = await orchestrator.createUser();

      const activationToken = await activation.createToken(createdUser.id);
      const usedActivationToken = await activation.markTokenAsUsed(
        activationToken.id
      );

      expect(usedActivationToken.used).not.toBe(null);

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH"
        }
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
        status_code: 404
      });
    });

    test("With valid activation token but with no user", async () => {
      const fakeUserUUID = orchestrator.createUUID();

      const activationObject = await activation.createToken(fakeUserUUID);

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${activationObject.id}`,
        {
          method: "PATCH"
        }
      );

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O id fornecido não foi encontrado no sistema.",
        action: "Verifique se o id foi digitado corretamente.",
        status_code: 404
      });
    });

    test("With valid activation token", async () => {
      const createdUser = await orchestrator.createUser({
        username: "AlmostActivatedUser",
        email: "almost.activated.user@curso.dev",
        password: "AlmostActivatedUser"
      });

      const activationObject = await activation.createToken(createdUser.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${activationObject.id}`,
        {
          method: "PATCH"
        }
      );

      expect(response.status).toBe(200);

      const activationResponseBody = await response.json();
      expect(activationResponseBody).toEqual({
        id: activationObject.id,
        used: activationResponseBody.used,
        user_id: createdUser.id,
        created_at: activationObject.created_at.toISOString(),
        expires_at: activationObject.expires_at.toISOString(),
        updated_at: activationResponseBody.updated_at
      });

      expect(activationResponseBody.used).not.toBe(null);

      expect(uuidVersion(activationResponseBody.id)).toBe(4);
      expect(uuidVersion(activationResponseBody.user_id)).toBe(4);
      expect(Date.parse(activationResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(activationResponseBody.updated_at)).not.toBeNaN();
      expect(Date.parse(activationResponseBody.expires_at)).not.toBeNaN();

      expect(
        activationResponseBody.updated_at >
          activationObject.updated_at.toISOString()
      ).toBe(true);

      const expiresAt = new Date(activationResponseBody.expires_at);
      const createdAt = new Date(activationResponseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(activation.EXPIRATION_IN_MILLISECONDS);

      const activatedUser = await user.findOneById(
        activationResponseBody.user_id
      );

      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
        "update:user"
      ]);
    });

    test("With valid token associated with already activated user", async () => {
      const createdUser = await orchestrator.createUser();

      await orchestrator.activateUser(createdUser);

      const activationToken = await activation.createToken(createdUser.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH"
        }
      );
      expect(response.status).toBe(403);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não pode mais utilizar tokens de ativação.",
        action: "Entre em contato com o suporte.",
        status_code: 403
      });
    });
  });
});
