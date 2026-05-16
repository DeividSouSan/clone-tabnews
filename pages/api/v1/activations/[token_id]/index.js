import controller from "infra/handlers";
import activation from "models/activation";
import authorization from "models/authorization";

const { createRouter } = require("next-connect");

const router = createRouter();
router.use(controller.injectUser);
router.use(controller.checkUserFeature("read:activation_token"), patchHandler);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const userTrigger = request.context.user;
  const activationTokenId = request.query.token_id;

  const activationTokeObject =
    await activation.findTokenById(activationTokenId);

  await activation.activateUserById(activationTokeObject.user_id);

  const usedActivationToken =
    await activation.markTokenAsUsed(activationTokenId);

  const secureOutputValues = authorization.filterOutput(
    userTrigger,
    "read:activation_token",
    usedActivationToken,
  );

  return response.status(200).json(secureOutputValues);
}
