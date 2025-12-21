import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/user.js";
import session from "models/session.js";

import retry from "async-retry";
import { faker } from "@faker-js/faker/.";
import activation from "models/activation";

const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}/messages`;

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (!response.ok) {
        throw Error();
      }
    }
  }
  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchEmailPage() {
      const response = await fetch(emailHttpUrl);

      if (!response.ok) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userObject) {
  return await user.create({
    username:
      userObject?.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userObject?.email || faker.internet.email(),
    password: userObject?.password || "validpassword",
  });
}

async function activateUser(createdUser) {
  return await activation.activateUserById(createdUser.id);
}

async function createSession(userId) {
  return await session.create(userId);
}

async function deleteEmails() {
  await fetch(emailHttpUrl, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function extractUUID(text) {
  const pattern =
    /\s*[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89aAbB][0-9a-f]{3}-[0-9a-f]{12}/;

  const UUID = pattern.exec(text)[0];

  return UUID;
}
async function getLastEmail() {
  const emailListResponse = await fetch(emailHttpUrl);
  const emailListBody = await emailListResponse.json();
  const lastEmailItem = emailListBody.pop();

  if (!lastEmailItem) return;

  const emailTextResponse = await fetch(
    `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}/messages/${lastEmailItem.id}.plain`,
  );

  lastEmailItem.text = await emailTextResponse.text();

  return lastEmailItem;
}
const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteEmails,
  extractUUID,
  getLastEmail,
  activateUser,
};

export default orchestrator;
