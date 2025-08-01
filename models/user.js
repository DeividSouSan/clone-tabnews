import database from "infra/database.js";
import { NotFoundError, ValidationError } from "infra/errors";
import password from "models/password.js";

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);
  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
          SELECT
            *
          FROM
            users
          WHERE
            LOWER(username) = LOWER($1)
          LIMIT
            1
          ;`,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O nome de usuário fornecido não foi encontrado no sistema.",
        action: "Verifique se o nome de usuário foi digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}

async function create(userData) {
  // fluxo de execução
  await validateUniqueUsername(userData.username);
  await validateUniqueEmail(userData.email);
  await hashPasswordInObject(userData);

  const newUser = await runCreateUserQuery(userData);
  return newUser;

  // detalhes de implementação

  async function runCreateUserQuery(userData) {
    const { username, email, password } = userData;

    const results = await database.query({
      text: `
          INSERT INTO
            users (username, email, password)
          VALUES
            ($1, $2, $3)
          RETURNING
            *
          ;`,
      values: [username, email, password],
    });

    return results.rows[0];
  }
}

async function update(username, newUserData) {
  const currentUserData = await findOneByUsername(username);

  if (
    "username" in newUserData &&
    newUserData.username.toLowerCase() !== username.toLowerCase()
  ) {
    await validateUniqueUsername(newUserData.username);
  }

  if ("email" in newUserData) {
    await validateUniqueEmail(newUserData.email);
  }

  if ("password" in newUserData) {
    await hashPasswordInObject(newUserData);
  }

  const patchedUser = { ...currentUserData, ...newUserData };

  const databaseUser = await runUpdateQuery(patchedUser);

  return databaseUser;

  async function runUpdateQuery(patchedUser) {
    const results = await database.query({
      text: `
          UPDATE 
            users
          SET 
            username = $2, 
            email = $3,
            password = $4,
            updated_at = timezone('utc', now())
          WHERE 
            id = $1
          RETURNING 
            *
          ;`,
      values: [
        patchedUser.id,
        patchedUser.username,
        patchedUser.email,
        patchedUser.password,
      ],
    });

    return results.rows[0];
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: `
          SELECT
            username
          FROM
            users
          WHERE
            LOWER(username) = LOWER($1)
          ;`,
    values: [username],
  });
  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O nome de usuário fornercido já está sendo utilizado",
      action: "Utilize outro nome de usuário para realizar esta operação",
    });
  }
}

async function validateUniqueEmail(userEmail) {
  const results = await database.query({
    text: `
          SELECT
            email
          FROM
            users
          WHERE
            LOWER(email) = LOWER($1)
          ;`,
    values: [userEmail],
  });
  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O email fornercido já está sendo utilizado",
      action: "Utilize outro email para realizar esta operação",
    });
  }
}

async function hashPasswordInObject(userData) {
  const hashedPassword = await password.hash(userData.password);

  userData.password = hashedPassword;
}

const user = {
  create,
  findOneByUsername,
  update,
};

export default user;
