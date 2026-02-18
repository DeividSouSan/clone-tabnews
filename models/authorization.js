function check(user, feature, resource) {
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
  if (feature === "read:user") {
    return {
      id: originalData.id,
      username: originalData.username,
      features: originalData.features,
      created_at: originalData.created_at,
      updated_at: originalData.updated_at
    };
  }

  if (feature === "read:user:self" && user.id === originalData.id) {
    return {
      id: originalData.id,
      email: user.email,
      username: originalData.username,
      features: originalData.features,
      created_at: originalData.created_at,
      updated_at: originalData.updated_at
    };
  }

  if (feature === "read:session" && user.id === originalData.user_id) {
    return {
      id: originalData.id,
      user_id: user.id,
      token: originalData.token,
      created_at: originalData.created_at,
      expires_at: originalData.expires_at,
      updated_at: originalData.updated_at
    };
  }

  if (feature === "delete:session") {
    return {
      id: originalData.id,
      user_id: originalData.user_id,
      token: originalData.token,
      expires_at: originalData.expires_at,
      created_at: originalData.created_at,
      updated_at: originalData.updated_at
    };
  }

  if (feature === "read:activation_token") {
    return {
      id: originalData.id,
      used: originalData.used,
      user_id: originalData.user_id,
      created_at: originalData.created_at.toISOString(),
      expires_at: originalData.expires_at.toISOString(),
      updated_at: originalData.updated_at
    };
  }

  if (feature === "read:migrations") {
    return originalData;
  }
}

const authorization = {
  check,
  filterOutput
};

export default authorization;
