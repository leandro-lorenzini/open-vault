const mongoose = require('mongoose');
const { sendEmail } = require('../helper/sendEmail');
const UserModel = require('../models/user.model');
const folderController = require('./folder.controller');
const crypto = require('crypto');
const passwordHelper = require('../helper/password.helper');

/**
 * Creates a new user and sends activation email
 * @param {String} organization
 * @param {String} name
 * @param {String} email
 * @param {String} password
 * @param {Boolean} admin
 * @param {[String]} groups
 * @param {Boolean} sso
 * @returns {Promise}
 */
function create(organization, name, email, password, admin, groups, sso) {
  return new Promise((resolve, reject) => {
    const tokens = !sso
      ? [
          {
            value: crypto
              .createHash('sha256')
              .update(crypto.randomBytes(32).toString('hex'))
              .digest('hex'),
            type: 'activation',
          },
        ]
      : [];

    let user = new UserModel({
      organization,
      name,
      email,
      password,
      admin,
      groups,
      tokens,
      sso: sso ? true : false,
      active: true,
    });

    user
      .save()
      .then((doc) => {
        resolve(doc);
        // Create personal folder
        folderController
          .create(organization, doc._id, null, doc._id)
          .catch((error) => {
            console.log(error);
          });
        // Send activation email
        if (!sso) {
          sendEmail(
            organization,
            email,
            'Activation email',
            'activation-email',
            {
              name,
              email,
              token: tokens[0].value,
            }
          );
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Updates a user details
 * @param {String} organization
 * @param {String} user
 * @param {String} name
 * @param {String} email
 * @param {[String]} groups
 * @returns {Promise}
 */
function update(organization, user, name, email, groups, active, sso) {
  return new Promise((resolve, reject) => {
    var data = {
      name,
      email,
      groups,
      active,
    };
    UserModel.updateOne({ _id: user, organization }, data)
      .then((result) => {
        if (result.modifiedCount || sso) {
          resolve({ ...data, _id: user });
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
 * Delete a user
 * @param {String} organization
 * @param {String} user
 * @returns {Promise}
 */
function remove(organization, user) {
  return new Promise((resolve, reject) => {
    UserModel.deleteOne({ _id: user, organization })
      .then((result) => {
        if (result.deletedCount) {
          resolve(result);
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
 * Updates the user password hash
 * @param {String} user
 * @param {String} password
 * @returns {Promise}
 */
function update_password(user, password) {
  return new Promise((resolve, reject) => {
    passwordHelper
      .hash(password)
      .then((password) => {
        UserModel.updateOne(
          {
            _id: user,
            $or: [{ sso: false }, { sso: { $exists: false } }],
          },
          { password }
        )
          .then((result) => {
            if (result.modifiedCount) {
              resolve(result);
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
 * Adds a new key to a user
 * Each device has its own key pair
 * @param {String} organization
 * @param {String} user
 * @param {String} value Public Key
 * @param {String} device Device description
 * @returns {Promise}
 */
function add_key(organization, user, value, device) {
  return new Promise((resolve, reject) => {
    let key = {
      _id: new mongoose.Types.ObjectId(),
      value,
      device,
    };
    UserModel.findOneAndUpdate(
      { _id: user, organization },
      { $addToSet: { keys: key } },
      { new: true }
    )
      .then((doc) => {
        for (let key of doc.keys) {
          if (key.value === value) {
            return resolve(key);
          }
        }
        reject('Key has not been added');
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Delete a key under a given user
 * @param {String} organization
 * @param {String} user
 * @param {String} keyId
 * @returns {Promise}
 */
function remove_key(organization, user, keyId) {
  return new Promise((resolve, reject) => {
    UserModel.updateOne(
      { _id: user, organization },
      { $pull: { keys: { _id: keyId } } }
    )
      .then((doc) => {
        resolve(doc);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Get user details
 * @param {String} organization
 * @param {String} user
 * @returns {Promise}
 */
function get(organization, user) {
  return new Promise((resolve, reject) => {
    UserModel.findOne({ _id: user, organization })
      .then((doc) => {
        resolve(doc);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Get user by email address (Includes password hash)
 * @param {String} email
 * @returns {Promise}
 */
function find(email) {
  return new Promise((resolve, reject) => {
    UserModel.findOne({ email })
      .then((doc) => {
        resolve(doc);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Get all users under an organization (Doesn;t include password)
 * @param {String} organization
 * @returns {Promise}
 */
function all(organization) {
  return new Promise((resolve, reject) => {
    UserModel.find({ organization }, { password: 0 })
      .then((doc) => {
        resolve(doc);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Remove a group reference for all users under an orgaization
 * Useful when a group is deleted on the organization level
 * @param {String} organization
 * @param {String} group
 * @returns {Promise}
 */
function remove_group_all(organization, group) {
  return new Promise((resolve, reject) => {
    UserModel.updateOne(
      { organization, groups: group },
      { $pull: { groups: group } }
    )
      .then((result) => {
        if (result.modifiedCount) {
          resolve(result);
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
 * Get all users with the specified groups
 * @param {String} organization
 * @param {[String]} groups
 * @returns {Promise}
 */
function get_group(organization, groups) {
  return new Promise((resolve, reject) => {
    UserModel.find({ organization, groups: { $in: groups } }, { password: 0 })
      .then((doc) => {
        resolve(doc);
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
 * @returns {Promise}
 */
function consume_token(user, token) {
  return new Promise((resolve, reject) => {
    let arrayFilters = token
      ? [{ 's._id': new mongoose.Types.ObjectId(token) }]
      : [{ 's.consumed': false }];

    UserModel.updateOne(
      { _id: user, tokens: { $exists: true } },
      { $set: { 'tokens.$[s].consumed': true } },
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
/**
 * Creates a new token under a user
 * @param {String} organization
 * @param {String} user
 * @param {('activation'|'reset')} type
 * @returns {Promise<String>}
 */
function add_token(organization, user, type) {
  return new Promise((resolve, reject) => {
    const token = crypto
      .createHash('sha256')
      .update(crypto.randomBytes(32).toString('hex'))
      .digest('hex');
    UserModel.findOneAndUpdate(
      { _id: user, organization },
      { $addToSet: { tokens: { value: token, type } } },
      { new: true }
    )
      .then((user) => {
        if (user.tokens.filter((t) => t.value === token).length) {
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
 * Function only returns valid tokens
 * @param {string} email
 * @param {string} token
 * @param {string} type
 * @returns
 */
function get_token(email, token, type) {
  return new Promise((resolve, reject) => {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    UserModel.findOne(
      {
        email: email,
        'tokens.value': token,
        'tokens.type': type,
        'tokens.date': { $gte: twelveHoursAgo },
        'tokens.consumed': false,
      },
      { email: 1, 'tokens.$': 1 }
    )
      .then((doc) => {
        resolve(doc);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

module.exports = {
  all,
  create,
  update,
  remove,
  get,
  find,
  updatePassword: update_password,
  key: {
    add: add_key,
    remove: remove_key,
  },
  group: {
    purge: remove_group_all,
    get: get_group,
  },
  token: {
    consume: consume_token,
    add: add_token,
    get: get_token,
  },
};
