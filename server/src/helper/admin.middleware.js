/**
 * Middleware to verify is authenticated user is an admin
 * Basically goes through the user's group memberhsip and check
 * if any of those groups grants admin rights.
 */
const userController = require('../controllers/user.controller');
const organizationController = require('../controllers/organization.controller');

function isAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.id) {
    return res.status(403).send('User not authenticated');
  }

  organizationController.get(req.session.user.organization).then((org) => {
    userController
      .get(req.session.user.organization, req.session.user.id)
      .then((user) => {
        let adminGroups = org.groups
          .filter((group) => group.admin)
          .map((group) => group._id.toString());
        for (let group of user.groups) {
          if (adminGroups.includes(group.toString())) {
            return next();
          }
        }
        return res.status(403).send('User is not authorized to perform action');
      })
      .catch((error) => {
        console.log(error);
        return res.status(500).send();
      });
  });
}

module.exports = isAdmin;
