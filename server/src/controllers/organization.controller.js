const { default: mongoose } = require('mongoose');
const OrganizationModel = require('../models/organization.model');
const userController = require('./user.controller');
const folderController = require('./folder.controller');
const organizationModel = require('../models/organization.model');
const crypto = require('crypto');

/**
 * Create a new organization
 * @param {String} name Organization name
 * @param {String} key Public Key
 * @returns {Promise}
 */
function create(name, key) {
  return new Promise((resolve, reject) => {
    let organization = new OrganizationModel({ name, key });
    organization
      .save()
      .then((doc) => {
        resolve({
          _id: doc._id,
          name: doc.name,
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Set SSO settings
 * @param {String} organization
 * @param {Boolean} enabled
 * @param {String} issuer
 * @param {String} entryPoint
 * @param {String} certificate
 * @param {Boolean} responseSigned
 * @param {Boolean} assertionSigned
 * @returns {Promise}
 */
function set_sso(organization, enabled, issuer, entryPoint, certificate, responseSigned, assertionSigned) {
  return new Promise((resolve, reject) => {
    let sso = {
      enabled,
      issuer,
      entryPoint,
      certificate,
      responseSigned,
      assertionSigned
    };
    organizationModel
      .updateOne({ _id: organization }, { sso })
      .then((result) => {
        if (result.modifiedCount) {
          resolve(sso);
        } else {
          reject();
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Set SMTP settings
 * @param {String} organization
 * @param {String} server
 * @param {Number} port
 * @param {Boolean} secure
 * @param {String} username
 * @param {String} password
 * @returns {Promise}
 */
function set_smtp(organization, server, port, secure, username, password) {
  return new Promise((resolve, reject) => {
    let smtp = {
      server,
      port,
      secure,
      username,
      password,
    };
    organizationModel
      .updateOne({ _id: organization }, { smtp })
      .then((result) => {
        if (result.modifiedCount) {
          resolve(smtp);
        } else {
          reject();
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Get an organization details
 * @param {String} id
 * @returns {Promise}
 */
function get(id) {
  return new Promise((resolve, reject) => {
    OrganizationModel.findOne({ _id: id })
      .then((doc) => {
        resolve(doc);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Get an organization details
 * @param {String} id
 * @returns {Promise}
 */
function find() {
  return new Promise((resolve, reject) => {
    OrganizationModel.findOne()
      .then((doc) => {
        resolve(doc);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Creates a new user group under an organization
 * @param {String} id
 * @param {String} name
 * @param {Boolean} admin
 * @returns {Promise}
 */
function add_group(id, name, admin) {
  return new Promise((resolve, reject) => {
    get(id)
      .then((org) => {
        const group = {
          _id: new mongoose.Types.ObjectId(),
          name,
          admin,
        };

        const existing = org.groups.filter((g) => g.name === name);

        if (existing.length > 0) {
          return resolve({
            _id: existing[0]._id,
            name: existing[0].name,
            admin: existing[0].admin,
            existing: true,
          });
        }

        OrganizationModel.updateOne(
          { _id: id },
          {
            $addToSet: { groups: group },
          }
        )
          .then((result) => {
            if (result.modifiedCount) {
              resolve(group);
            } else {
              reject();
            }
          })
          .catch((error) => {
            reject(error);
          });
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Removes a group from an organization
 * Also removes group reference from folders and users
 * @param {String} organizationId
 * @param {String} groupId
 * @returns {Promise}
 */
function remove_group(organizationId, groupId) {
  return new Promise((resolve, reject) => {
    OrganizationModel.updateOne(
      { _id: organizationId },
      {
        $pull: { groups: { _id: groupId } },
      }
    )
      .then((result) => {
        if (result.modifiedCount) {
          resolve(result);
          // Remove group from users
          userController.group.purge(organizationId, groupId).catch((error) => {
            console.log(error);
          });
          // Remove group from folders
          folderController.group
            .purge(organizationId, groupId)
            .catch((error) => {
              console.log(error);
            });
        } else {
          reject();
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Updates a group details
 * @param {String} organizationId
 * @param {String} groupId
 * @param {String} name
 * @param {Boolean} admin
 * @returns
 */
function update_group(organizationId, groupId, name, admin) {
  return new Promise((resolve, reject) => {
    OrganizationModel.updateOne(
      { _id: organizationId },
      { $set: { 'groups.$[g].name': name, 'groups.$[g].admin': admin } },
      { arrayFilters: [{ 'g._id': groupId }] }
    )
      .then((result) => {
        if (result.modifiedCount) {
          resolve();
        } else {
          reject();
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * Creates a new token under a user
 * @param {String} organization
 * @param {String} user
 * @param {('sso')} type
 * @returns {Promise<String>}
 */
function add_token(organization, type) {
  return new Promise((resolve, reject) => {
    const token = crypto
      .createHash('sha256')
      .update(crypto.randomBytes(32).toString('hex'))
      .digest('hex');
    OrganizationModel.findOneAndUpdate(
      { _id: organization },
      { $addToSet: { tokens: { value: token, type } } },
      { new: true }
    )
      .then((organization) => {
        if (organization.tokens.filter((t) => t.value === token).length) {
          resolve(token);
        }
        reject('Token not created');
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Finds a token by email, token and type
 * Attention! This function returns consumed tokens!
 * @param {string} email
 * @param {string} token
 * @param {('sso')} type
 * @returns
 */
function get_token(organization, token, type) {
  return new Promise((resolve, reject) => {
    const oneMinuteAgo = new Date(Date.now() - 120 * 1000);
    OrganizationModel.findOne(
      {
        _id: organization,
        tokens: {
          $elemMatch: {
            value: token.toString(),
            type: type,
            date: { $gte: oneMinuteAgo },
          },
        },
      },
      { 'tokens.$': 1 }
    )
      .then((doc) => {
        if (doc?.tokens) {
          resolve(doc.tokens[0]);
        } else {
          resolve();
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * Invalidate a activation/password reset token
 * @param {String} user
 * @param {String} token
 * @param {('pending'|'success'|'error')} status
 * @returns {Promise}
 */
function consume_token(organization, token, status, user) {
  return new Promise((resolve, reject) => {
    let arrayFilters = token
      ? [{ 's._id': new mongoose.Types.ObjectId(token) }]
      : [{ 's.consumed': false }];

    OrganizationModel.updateOne(
      { _id: organization, tokens: { $exists: true } },
      {
        $set: {
          'tokens.$[s].consumed': true,
          'tokens.$[s].status': status,
          'tokens.$[s].user': user,
        },
      },
      { arrayFilters }
    )
      .then((result) => {
        if (result.modifiedCount) {
          resolve();
        } else {
          reject();
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

module.exports = {
  create,
  get,
  find,
  sso: { set: set_sso },
  smtp: { set: set_smtp },
  group: {
    add: add_group,
    remove: remove_group,
    update: update_group,
  },
  token: {
    add: add_token,
    get: get_token,
    consume: consume_token,
  },
};
