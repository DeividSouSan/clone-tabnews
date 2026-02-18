import { createRouter } from "next-connect";
import controller from "infra/handlers.js";
import user from "models/user.js";
import session from "models/session.js";
import authorization from "models/authorization";

const router = createRouter();

router.use(controller.injectUser);
router.use(controller.checkUserFeature("read:session"), getHandler);
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTrigger = request.context.user;
  const sessionToken = request.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  const userFound = await user.findOneById(sessionObject.user_id);

  const renewedSessionObject = await session.renew(sessionObject.id);
  controller.setCookie(renewedSessionObject.token, response);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate"
  ); // ninguém pode armazenar

  const secureOutputValues = authorization.filterOutput(
    userTrigger,
    "read:user:self", // granularidade de resposta diferente
    userFound
  );

  return response.status(200).json(secureOutputValues);
}
