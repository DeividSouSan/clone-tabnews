import { InternalServerError } from "infra/errors";

const availableFeatures = [
  // USER
  "create:user",
  "read:user",
  "read:user:self",
  "update:user",
  "update:user:others",

  // SESSION
  "create:session",
  "read:session",

  // ACTIVATION
  "read:activation_token",

  // MIGRATIONS
  "read:migrations",
  "run:migrations",

  // STATUS
  "read:status",
  "read:status:sensitive",
];

// main functions

function check(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);

  const UNAUTHORIZED = false;
  const AUTHORIZED = true;

  if (!user.features.includes(feature)) return UNAUTHORIZED;

  if (feature === "update:user" && resource) {
    if (user.id !== resource.id)
      if (!check(user, "update:user:others")) return UNAUTHORIZED;
  }

  return AUTHORIZED;
}

function filterOutput(user, feature, originalData) {
  validateUser(user);
  validateFeature(feature);
  validateOriginalData(originalData);

  if (feature === "read:user") {
    return {
      id: originalData.id,
      username: originalData.username,
      features: originalData.features,
      created_at: originalData.created_at,
      updated_at: originalData.updated_at,
    };
  }

  if (feature === "read:user:self" && user.id === originalData.id) {
    return {
      id: originalData.id,
      email: user.email,
      username: originalData.username,
      features: originalData.features,
      created_at: originalData.created_at,
      updated_at: originalData.updated_at,
    };
  }

  if (feature === "read:session" && user.id === originalData.user_id) {
    return {
      id: originalData.id,
      user_id: user.id,
      token: originalData.token,
      created_at: originalData.created_at,
      expires_at: originalData.expires_at,
      updated_at: originalData.updated_at,
    };
  }

  if (feature === "delete:session") {
    return {
      id: originalData.id,
      user_id: originalData.user_id,
      token: originalData.token,
      expires_at: originalData.expires_at,
      created_at: originalData.created_at,
      updated_at: originalData.updated_at,
    };
  }

  if (feature === "read:activation_token") {
    return {
      id: originalData.id,
      used: originalData.used,
      user_id: originalData.user_id,
      created_at: originalData.created_at.toISOString(),
      expires_at: originalData.expires_at.toISOString(),
      updated_at: originalData.updated_at,
    };
  }

  if (feature === "read:migrations") {
    return originalData.map((migration) => {
      return {
        path: migration.path,
        name: migration.name,
        timestamp: migration.timestamp,
      };
    });
  }

  if (feature.includes("read:status")) {
    const output = {
      updated_at: originalData.updated_at,
      dependencies: {
        database: {
          opened_connections:
            originalData.dependencies.database.opened_connections,
          max_connections: parseInt(
            originalData.dependencies.database.max_connections,
          ),
        },
      },
    };

    if (check(user, "read:status:sensitive")) {
      output.dependencies.database.version =
        originalData.dependencies.database.version;
      return output;
    }

    return output;
  }
}

// validation functions
function validateFeature(feature) {
  if (!feature || !availableFeatures.includes(feature)) {
    throw new InternalServerError({
      cause:
        "É necessário fornecer uma feature conhecida no model `authorization`.",
    });
  }
}

function validateUser(user) {
  if (!user || !user.features) {
    throw new InternalServerError({
      cause: "É necessário fornecer `user` no model `authorization`.",
    });
  }
}

function validateOriginalData(originalData) {
  if (!originalData) {
    throw new InternalServerError({
      cause: "É necessário fornecer `originalData` no model `authorization`.",
    });
  }
}

const authorization = {
  check,
  filterOutput,
};

export default authorization;
