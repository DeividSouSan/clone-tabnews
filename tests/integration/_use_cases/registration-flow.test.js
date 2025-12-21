import webserver from "infra/webserver";
import activation from "models/activation";
import user from "models/user";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteEmails();
});

describe("Use Case: Registration Flow (all successful)", () => {
  let createUserResponseBody;
  let activationTokenId;
  let activationResponseBody;
  let createSessionResponseBody;
  let activatedUser;
  test("Create user account", async () => {
    const createUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlow",
          email: "registration.flow@curso.dev",
          password: "RegistrationFlowPassword",
        }),
      },
    );

    expect(createUserResponse.status).toBe(201);

    createUserResponseBody = await createUserResponse.json();

    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "RegistrationFlow",
      email: "registration.flow@curso.dev",
      features: ["read:activation_token"],
      password: createUserResponseBody.password,
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@curso.dev>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@curso.dev>");
    expect(lastEmail.subject).toBe("Ative sua conta no FinTab!");
    expect(lastEmail.text).toContain("RegistrationFlow");

    activationTokenId = orchestrator.extractUUID(lastEmail.text);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${activationTokenId}`,
    );

    const activationTokenObject =
      await activation.findValidTokenById(activationTokenId);

    expect(activationTokenObject.user_id).toBe(createUserResponseBody.id);
    expect(activationTokenObject.used).toBe(null);
  });

  test("Activate account", async () => {
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${activationTokenId}`,
      {
        method: "PATCH",
      },
    );

    expect(activationResponse.status).toBe(200);

    activationResponseBody = await activationResponse.json();

    expect(Date.parse(activationResponseBody.used)).not.toBeNaN();

    activatedUser = await user.findOneByUsername("RegistrationFlow");
    expect(activatedUser.features).toEqual(["create:session", "read:session"]);
  });
  test("Login", async () => {
    const createSessionResponse = await fetch(
      `http://localhost:3000/api/v1/sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "registration.flow@curso.dev",
          password: "RegistrationFlowPassword",
        }),
      },
    );

    expect(createSessionResponse.status).toBe(201);

    createSessionResponseBody = await createSessionResponse.json();

    expect(createSessionResponseBody.user_id).toBe(createUserResponseBody.id);
  });
  test("Get user information", async () => {
    const userResponse = await fetch("http://localhost:3000/api/v1/user", {
      method: "GET",
      headers: {
        Cookie: `session_id=${createSessionResponseBody.token}`,
      },
    });

    expect(userResponse.status).toBe(200);

    const userResponseBody = await userResponse.json();
    expect(userResponseBody).toEqual({
      id: activatedUser.id,
      username: "RegistrationFlow",
      email: "registration.flow@curso.dev",
      features: ["create:session", "read:session"],
      password: activatedUser.password,
      created_at: activatedUser.created_at.toISOString(),
      updated_at: activatedUser.updated_at.toISOString(),
    });
  });
});
