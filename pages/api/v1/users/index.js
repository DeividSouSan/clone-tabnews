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

  // 1. Criar token

  await activation.sendEmailToUser(newUser);

  return response.status(201).json(newUser);
}
