import session from "models/session.js";
import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";

import webserver from "infra/webserver";
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Anonymous user", () => {
    test("With direct access", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/user`);

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar essa ação.",
        action: `Verifique se o seu usuário possui a feature read:session.`,
        status_code: 403
      });
    });
  });
  describe("Authenticated user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession"
      });

      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: "session_id=" + sessionObject.token
        }
      });

      expect(response.status).toBe(200);

      const cacheControl = response.headers.get("Cache-control");

      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate"
      );

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithValidSession",
        email: createdUser.email,
        features: ["create:session", "read:session", "update:user"],
        created_at: createdUser.created_at.toISOString(),
        updated_at: activatedUser.updated_at.toISOString()
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      // session renewal assertions
      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token
      );

      expect(renewedSessionObject.expires_at > sessionObject.expires_at).toBe(
        true
      );

      expect(renewedSessionObject.updated_at > sessionObject.updated_at).toBe(
        true
      );

      // set-cookie assertions
      const parsedSetCookie = setCookieParser(response, {
        map: true
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: renewedSessionObject.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true
      });
    });

    test("With non-existent session", async () => {
      const token =
        "6279f7f493ccc1726d468044c02641e0970bb50a1ff128f1d263895c986e987c2152ce5e20b2824ec924f6e2fcc156a2";

      const response = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: "session_id=" + token
        }
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS)
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithExpiredSession"
      });

      const sessionObject = await orchestrator.createSession(createdUser);

      jest.useRealTimers();

      const response = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: "session_id=" + sessionObject.token
        }
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401
      });
    });

    test("With almost expired session", async () => {
      jest.useFakeTimers({
        now: new Date(
          Date.now() - session.EXPIRATION_IN_MILLISECONDS + 60 * 1000
        ) // Volta 29 dias no passado, faltando 1 minuto para expirar
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithAlmostExpiredSession"
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      jest.useRealTimers();

      const response = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: "session_id=" + sessionObject.token
        }
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithAlmostExpiredSession",
        email: createdUser.email,
        features: ["create:session", "read:session", "update:user"],
        created_at: createdUser.created_at.toISOString(),
        updated_at: activatedUser.updated_at.toISOString()
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      // session renewal assertions
      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token
      );

      expect(renewedSessionObject.expires_at > sessionObject.expires_at).toBe(
        true
      );

      expect(renewedSessionObject.updated_at > sessionObject.updated_at).toBe(
        true
      );

      // set-cookie assertions
      const parsedSetCookie = setCookieParser(response, {
        map: true
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: renewedSessionObject.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true
      });
    });
  });

  afterEach(async () => {
    const response = await fetch(`${webserver.origin}/api/v1/status`);
    const responseBody = await response.json();
    if (responseBody.dependencies.database.opened_connections !== 1) {
      throw new Error(
        "Conexões que foram abertas não foram fechadas adequadamente."
      );
    }
  });
});
