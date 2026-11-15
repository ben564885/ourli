const { withEntitlementsPlist } = require("expo/config-plugins");

module.exports = function withoutPush(config) {
  return withEntitlementsPlist(config, (c) => {
    delete c.modResults["aps-environment"];
    return c;
  });
};
