import { createRouter } from "next-connect";
import controller from "infra/handlers.js";
import authentication from "models/authentication.js";
import session from "models/session.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const inputData = request.body;

  const authenticatedUser = await authentication.execute(
    inputData.email,
    inputData.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  controller.setCookie(newSession.token, response);

  return response.status(201).json(newSession);
}
