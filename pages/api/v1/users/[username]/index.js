import { createRouter } from "next-connect";
import controller from "infra/handlers.js";
import user from "models/user.js";

const router = createRouter();

router.get(getHandler);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);
  return response.status(200).json(userFound);
}

async function patchHandler(request, response) {
  const username = request.query.username; // usuário afetado
  const newUserData = request.body; // dados atualizados

  const updatedUser = await user.update(username, newUserData);

  return response.status(200).json(updatedUser);
}
