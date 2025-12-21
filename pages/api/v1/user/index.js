import { createRouter } from "next-connect";
import controller from "infra/handlers.js";
import user from "models/user.js";
import session from "models/session.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.use(controller.canRequest("read:session"), getHandler);
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const sessionToken = request.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  const userFound = await user.findOneById(sessionObject.user_id);

  const renewedSessionObject = await session.renew(sessionObject.id);
  controller.setCookie(renewedSessionObject.token, response);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  ); // ninguém pode armazenar
  return response.status(200).json(userFound);
}
