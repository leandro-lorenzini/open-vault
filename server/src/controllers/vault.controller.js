const FolderModel = require('../models/folder.model');
const mongoose = require('mongoose');
/**
 * Add a vault to an existing secret
 * @param {String} organization
 * @param {String} folder
 * @param {String} secret
 * @param {String} user
 * @param {String} key
 * @param {String} ciphertext
 * @param {Number} version
 * @returns {Promise}
 */
function add(organization, folder, secret, user, key, ciphertext, version) {
  return new Promise((resolve, reject) => {
    let vault = {
      _id: new mongoose.Types.ObjectId(),
      user,
      key,
      ciphertext,
      version,
    };
    FolderModel.updateOne(
      { _id: folder, organization, 'secrets._id': secret },
      { version, $addToSet: { 'secrets.$.vaults': vault } }
    )
      .then((result) => {
        if (result.modifiedCount) {
          resolve(vault);
        } else {
          reject(result);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Update a vault with a new secret version
 * @param {String} organization
 * @param {String} folder
 * @param {String} secret
 * @param {String} user
 * @param {String} key
 * @param {String} ciphertext
 * @param {Number} version
 * @returns {Promise}
 */
function update(organization, folder, secret, user, key, ciphertext, version) {
  return new Promise((resolve, reject) => {
    FolderModel.updateOne(
      { _id: folder, organization },
      {
        $set: {
          'secrets.$[s].vaults.$[v].ciphertext': ciphertext,
          'secrets.$[s].vaults.$[v].version': version,
        },
      },
      {
        arrayFilters: [
          {
            's._id': new mongoose.Types.ObjectId(secret),
          },
          {
            'v.user': new mongoose.Types.ObjectId(user),
            'v.key': new mongoose.Types.ObjectId(key),
          },
        ],
      }
    )
      .then((result) => {
        if (result.modifiedCount) {
          resolve(result.modifiedCount);
        } else {
          reject(result);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Remove specified vaults under a secret
 * @param {String} organization
 * @param {String} folder
 * @param {String} secret
 * @param {[String]} vaults
 * @returns {Promise}
 */
function remove(organization, folder, secret, vaults) {
  return new Promise((resolve, reject) => {
    FolderModel.updateOne(
      { _id: folder, organization, 'secrets._id': secret },
      { $pull: { 'secrets.$.vaults': { _id: { $in: vaults } } } }
    )
      .then((result) => {
        if (result.modifiedCount) {
          resolve(result.modifiedCount);
        } else {
          reject(result);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * Gets a list of vaults that shouldn't exist
 * @param {*} organization
 * @param {*} folder
 * @param {*} secret
 * @returns {Promise<[]>}
 */
function inaccessible(organization, folder, secret) {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  return new Promise((resolve, reject) => {
    const pipeline = [
      {
        $match: {
          organization: new mongoose.Types.ObjectId(organization),
          _id: folder ? new mongoose.Types.ObjectId(folder) : { $exists: true },
          $or: [{ user: { $exists: false } }, { user: null }],
        },
      },
      { $unwind: { path: '$secrets', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          'secrets._id': secret
            ? new mongoose.Types.ObjectId(secret)
            : { $exists: true },
        },
      },
      {
        $unwind: {
          // eslint-disable-next-line sonarjs/no-duplicate-string
          path: '$secrets.vaults',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $unset: ['secrets.vaults.ciphertext'] },
      {
        $lookup: {
          from: 'users',
          localField: 'secrets.vaults.user',
          foreignField: '_id',
          as: 'secrets.vaults.user',
        },
      },
      {
        $unset: [
          'secrets.vaults.user.password',
          'secrets.vaults.user.tokens',
          'secrets.vaults.user.keys',
        ],
      },
      {
        $unwind: {
          path: '$secrets.vaults.user',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: { 'secrets.vaults.organizationOwned': false } },
      {
        $group: {
          _id: {
            _id: '$_id',
            name: '$name',
            secretId: '$secrets._id',
          },
          groups: { $first: '$groups' },
          secret: { $first: '$secrets' },
          vaults: { $push: '$secrets.vaults' },
        },
      },
      {
        $addFields: {
          'secret.vaults': '$vaults',
        },
      },
      {
        $group: {
          _id: '$_id.name',
          groups: { $first: '$groups' },
          secrets: { $push: '$secret' },
        },
      },
    ];

    let issues = [];
    FolderModel.aggregate(pipeline)
      .then((folders) => {
        for (let folder of folders) {
          let secrets = [];
          for (let secret of folder.secrets) {
            let users = [];
            for (let vault of secret.vaults) {
              let issue = true;
              for (let group of vault.user.groups) {
                if (
                  folder.groups
                    .map((g) => g.toString())
                    .includes(group.toString())
                ) {
                  issue = false;
                }
              }
              if (issue) {
                users.push(vault.user.email);
              }
            }
            if (users.length) {
              users = users.filter((element, index) => {
                return users.indexOf(element) === index;
              });
              secrets.push({ ...secret, folder: folder._id, users });
            }
          }
          if (secrets.length) {
            issues = issues.concat(secrets);
          }
        }
        resolve(issues);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

module.exports = {
  add,
  update,
  remove,
  inaccessible,
};
