import { createRouter } from "next-connect";
import controller from "infra/handlers.js";
import authentication from "models/authentication.js";
import session from "models/session.js";
import { ForbiddenError } from "infra/errors";
import authorization from "models/authorization";

const router = createRouter();

router.use(controller.injectUser);
router.post(controller.checkUserFeature("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const inputData = request.body;

  const authenticatedUser = await authentication.execute(
    inputData.email,
    inputData.password,
  );

  const isAuthorized = authorization.check(authenticatedUser, "create:session");

  if (!isAuthorized) {
    throw new ForbiddenError({
      message: "Você não possui permissão para fazer login.",
      action: "Contate o suporte caso acredito que isso seja um erro.",
    });
  }

  const newSession = await session.create(authenticatedUser.id);

  controller.setCookie(newSession.token, response);
  return response.status(201).json(newSession);
}

async function deleteHandler(request, response) {
  const sessionToken = request.cookies.session_id;

  const currentSession = await session.findOneValidByToken(sessionToken);
  const expiredSession = await session.expireById(currentSession.id);

  controller.clearSessionCookie(response);

  return response.status(200).json(expiredSession);
}
