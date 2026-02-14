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

const authorization = {
  check
};

export default authorization;
