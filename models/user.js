import database from "/infra/database.js";
import { NotFoundError, ValidationError } from "/infra/errors";


async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);
  return userFound

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
  const newUser = await runCreateUserQuery(userData);
  return newUser;

  // detalhes de implementação
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
        action: "Utilize outro nome de usuário para realizar o cadastro",
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
        action: "Utilize outro email para realizar o cadastro",
      });
    }
  }

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

const user = {
  create,
  findOneByUsername,
};

export default user;
