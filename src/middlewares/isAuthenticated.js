const passport = require("passport");
const response = require("./../app/responses");
const mongoose = require("mongoose");
const User = mongoose.model("User");
module.exports = (role = []) => {
  return (req, res, next) => {
    passport.authenticate(
      "jwt",
      { session: false },
      async function (err, user, info) {
        if (err) {
          return response.error(res, err);
        }
        console.log("user--------->", user);
        if (!user) {
          return response.unAuthorize(res, info);
        }
        const u = await User.findById(user.id);
        // console.log(req.headers.authorization)
        if (req.query && req.query.ischeck && u.subscriptionplan.device !== 0) {
          const token = req.headers.authorization.split("jwt")[1].trim();
          const isvalid = u.devices.find((f) => f.token === token);
          if (!isvalid) {
            return response.unAuthorize(res, { message: "⚠️ You've reached your limit for this plan. Upgrade now to continue enjoying unlimited users!" });
          }
          console.log(token);
        }
        // if (u.tokenVersion !== user.tokenVersion) { return response.unAuthorize(res, { message: "Invalid login" }); }
        if (role.indexOf(user.type) == -1) {
          return response.unAuthorize(res, { message: "Invalid login" });
        }
        req.user = user;
        next();
      }
    )(req, res, next);
  };
};
