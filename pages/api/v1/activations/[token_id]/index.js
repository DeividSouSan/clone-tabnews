import controller from "infra/handlers";
import activation from "models/activation";

const { createRouter } = require("next-connect");

const router = createRouter();

router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activationTokenId = request.query.token_id;

  const usedActivationToken =
    await activation.markTokenAsUsed(activationTokenId);

  await activation.activateUserById(usedActivationToken.user_id);

  return response.status(200).json(usedActivationToken);
}
