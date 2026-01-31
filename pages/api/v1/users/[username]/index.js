import { createRouter } from "next-connect";
import controller from "infra/handlers.js";
import user from "models/user.js";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router.use(controller.injectUser);
router.get(getHandler);
router.patch(controller.checkUserFeature("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);
  return response.status(200).json(userFound);
}

async function patchHandler(request, response) {
  const newData = request.body;

  const targetUserUsername = request.query.username;
  const targetUser = await user.findOneByUsername(targetUserUsername);

  const triggerUser = request.context.user;

  if (!authorization.check(triggerUser, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar outro usuário",
      action:
        "Verifique se você possui a feature necessária para atualizar outro usuário",
    });
  }

  const updatedUser = await user.update(targetUserUsername, newData);

  return response.status(200).json(updatedUser);
}
