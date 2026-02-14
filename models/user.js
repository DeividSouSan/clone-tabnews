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
      values: [username]
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O nome de usuário fornecido não foi encontrado no sistema.",
        action: "Verifique se o nome de usuário foi digitado corretamente."
      });
    }

    return results.rows[0];
  }
}

async function findOneByEmail(email) {
  const userFound = await runSelectQuery(email);
  return userFound;

  async function runSelectQuery(email) {
    const results = await database.query({
      text: `
          SELECT
            *
          FROM
            users
          WHERE
            LOWER(email) = LOWER($1)
          LIMIT
            1
          ;`,
      values: [email]
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O nome de usuário fornecido não foi encontrado no sistema.",
        action: "Verifique se o nome de usuário foi digitado corretamente."
      });
    }

    return results.rows[0];
  }
}

async function findOneById(id) {
  const userFound = await runSelectQuery(id);
  return userFound;

  async function runSelectQuery(id) {
    const results = await database.query({
      text: `
          SELECT
            *
          FROM
            users
          WHERE
            id = $1
          LIMIT
            1
          ;`,
      values: [id]
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O id fornecido não foi encontrado no sistema.",
        action: "Verifique se o id foi digitado corretamente."
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
  injectDefaultFeaturesInObject(userData);

  const newUser = await runCreateUserQuery(userData);
  return newUser;

  // detalhes de implementação

  async function runCreateUserQuery(userData) {
    const { username, email, password, features } = userData;

    const results = await database.query({
      text: `
          INSERT INTO
            users (username, email, password, features)
          VALUES
            ($1, $2, $3, $4)
          RETURNING
            *
          ;`,
      values: [username, email, password, features]
    });

    return results.rows[0];
  }

  function injectDefaultFeaturesInObject(userData) {
    userData.features = ["read:activation_token"];
  }
}

async function setFeatures(userId, features) {
  const updatedUser = await runUpdateQuery(userId);
  return updatedUser;

  async function runUpdateQuery(userId) {
    const results = await database.query({
      text: `
      UPDATE
        users
      SET
        features = $2,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING 
      *
    ;`,
      values: [userId, features]
    });

    return results.rows[0];
  }
}

async function addFeatures(userId, features) {
  const updatedUser = await runUpdateQuery(userId);
  return updatedUser;

  async function runUpdateQuery(userId) {
    const results = await database.query({
      text: `
      UPDATE
        users
      SET
        features = array_cat(features, $2),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING 
      *
    ;`,
      values: [userId, features]
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
        patchedUser.password
      ]
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
    values: [username]
  });
  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O nome de usuário fornercido já está sendo utilizado",
      action: "Utilize outro nome de usuário para realizar esta operação"
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
    values: [userEmail]
  });
  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O email fornercido já está sendo utilizado",
      action: "Utilize outro email para realizar esta operação"
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
  findOneByEmail,
  findOneById,
  setFeatures,
  update,
  addFeatures
};

export default user;
