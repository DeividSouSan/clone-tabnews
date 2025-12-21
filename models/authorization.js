function check(user, feature) {
  return user.features.includes(feature);
}

const authorization = {
  check,
};

export default authorization;
