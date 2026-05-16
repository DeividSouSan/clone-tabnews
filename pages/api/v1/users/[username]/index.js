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
  const userTrigger = request.context.user;
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);

  const secureOutputValues = authorization.filterOutput(
    userTrigger,
    "read:user",
    userFound,
  );

  return response.status(200).json(secureOutputValues);
}

async function patchHandler(request, response) {
  const newData = request.body;

  const userTargetUsername = request.query.username;
  const userTarget = await user.findOneByUsername(userTargetUsername);

  const userTrigger = request.context.user;

  if (!authorization.check(userTrigger, "update:user", userTarget)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar outro usuário",
      action:
        "Verifique se você possui a feature necessária para atualizar outro usuário",
    });
  }

  const userUpdated = await user.update(userTargetUsername, newData);
  const secureOutputValues = authorization.filterOutput(
    userTrigger,
    "read:user",
    userUpdated,
  );

  return response.status(200).json(secureOutputValues);
}
