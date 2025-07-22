import { createRouter } from "next-connect";
import controller from "/infra/handlers.js";
import user from "/models/user.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userData = request.body;

  const newUser = await user.create(userData);

  return response.status(201).json(newUser);
}
