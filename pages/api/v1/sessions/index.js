import { createRouter } from "next-connect";
import controller from "infra/handlers.js";
import authentication from "models/authentication.js";
import session from "models/session.js";
import { ForbiddenError } from "infra/errors";
import authorization from "models/authorization";

export default createRouter()
  .use(controller.injectUser)
  .post(controller.checkUserFeature("create:session"), postHandler)
  .delete(deleteHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const inputData = request.body;

  const userAuthenticated = await authentication.execute(
    inputData.email,
    inputData.password
  );

  const isAuthorized = authorization.check(userAuthenticated, "create:session");

  if (!isAuthorized) {
    throw new ForbiddenError({
      message: "Você não possui permissão para fazer login.",
      action: "Contate o suporte caso acredito que isso seja um erro."
    });
  }

  const newSession = await session.create(userAuthenticated.id);

  controller.setCookie(newSession.token, response);

  const secureOutputValues = authorization.filterOutput(
    userAuthenticated,
    "read:session",
    newSession
  );

  return response.status(201).json(secureOutputValues);
}

async function deleteHandler(request, response) {
  const userTrigger = request.context.user;
  const sessionToken = request.cookies.session_id;

  const currentSession = await session.findOneValidByToken(sessionToken);
  const expiredSession = await session.expireById(currentSession.id);

  controller.clearSessionCookie(response);

  const secureOutputValues = authorization.filterOutput(
    userTrigger,
    "read:session",
    expiredSession
  );

  return response.status(200).json(secureOutputValues);
}
