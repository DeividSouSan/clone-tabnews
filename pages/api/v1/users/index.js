import { createRouter } from "next-connect";
import controller from "infra/handlers.js";
import user from "models/user.js";
import activation from "models/activation.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userData = request.body;

  const newUser = await user.create(userData);

  const activationToken = await activation.createToken(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);

  return response.status(201).json(newUser);
}
