/**
 * Middleware to check if user is authenticated
 */
const userController = require('../controllers/user.controller');

function isAuthenticated(req, res, next) {
  if (!req.session.user || !req.session.user.id) {
    return res.status(403).send();
  } else {
    userController
      .get(req.session.user.organization, req.session.user.id)
      .then((user) => {
        if (user) {
          req.user = user._id;
          req.organization = user.organization;
          req.groups = user.groups;
          req.sso = user.sso;
          return next();
        } else {
          return res.status(403).send();
        }
      })
      .catch((error) => {
        console.log(error);
        return res.status(403).send();
      });
  }
}

module.exports = isAuthenticated;
