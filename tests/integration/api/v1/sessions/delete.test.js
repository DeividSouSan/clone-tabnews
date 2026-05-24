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

describe("DELETE /api/v1/user", () => {
  describe("Authenticated user", () => {
    test("With non-existent session", async () => {
      const nonexistentToken =
        "6279f7f492ccc1726d468044c02641e0970bb50a1ff128f1d263895c986e987c2152ce5e20b2824ec924f6e2fcc156a2";

      const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: "session_id=" + nonexistentToken
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

      const createdUser = await orchestrator.createUser();
      const sessionObject = await orchestrator.createSession(createdUser);

      jest.useRealTimers();

      const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
        method: "DELETE",
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

    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser();

      const sessionObject = await orchestrator.createSession(createdUser);

      const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: "session_id=" + sessionObject.token
        }
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: sessionObject.id,
        token: sessionObject.token,
        user_id: sessionObject.user_id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(
        responseBody.expires_at < sessionObject.expires_at.toISOString()
      ).toBe(true);

      expect(
        responseBody.updated_at > sessionObject.updated_at.toISOString()
      ).toBe(true);

      // set-cookie assertions
      const parsedSetCookie = setCookieParser(response, {
        map: true
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "",
        maxAge: 0,
        path: "/",
        httpOnly: true
      });

      // double-check assertions

      const doubleCheckResponse = await fetch(
        `${webserver.origin}/api/v1/user`,
        {
          headers: {
            Cookie: "session_id=" + sessionObject.token
          }
        }
      );

      expect(doubleCheckResponse.status).toBe(401);
      const doubleCheckResponseBody = await doubleCheckResponse.json();
      expect(doubleCheckResponseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401
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
