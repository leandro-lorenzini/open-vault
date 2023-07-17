const FolderModel = require('../models/folder.model');

/**
 * Creates a new folder under an organization
 * @param {String} organization Organization Id
 * @param {String} name Folder name
 * @param {[String]} groups Group IDs
 * @param {String} user User ID (only used for personal folders)
 * @returns {Promise}
 */
function create(organization, name, groups, user) {
  return new Promise((resolve, reject) => {
    let folder = new FolderModel({
      organization,
      name,
      groups,
      user,
    });
    folder
      .save()
      .then((doc) => {
        resolve(doc);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * Updates a folder name and groups
 * @param {String} organization Organization Id
 * @param {String} folder Folder ID
 * @param {String} name Folder name
 * @param {[String]} groups Group IDs
 * @returns {Promise}
 */
function update(organization, folder, name, groups) {
  return new Promise((resolve, reject) => {
    let doc = {
      name,
      groups,
    };
    FolderModel.updateOne({ _id: folder, organization }, doc)
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
 * Get all folders under an organization (Without returning secrets)
 * @param {String} organization
 * @returns {Promise}
 */
function get(organization) {
  return new Promise((resolve, reject) => {
    FolderModel.find({ organization }, { secrets: 0 })
      .then((folders) => {
        resolve(folders);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * Remove a certain group from all folders
 * Useful when a group is deleted on the organization level
 * @param {String} organization
 * @param {String} group
 * @returns {Promise}
 */
function remove_group_all(organization, group) {
  return new Promise((resolve, reject) => {
    FolderModel.updateOne(
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
 * Get all folders under an organization and their secrets for the
 * specified groups and User ID (For personal folders)
 * @param {String} organization
 * @param {[String]} groups
 * @param {String} user
 * @returns {Promise}
 */
function acessible(organization, groups, user) {
  return new Promise((resolve, reject) => {
    const conditions = user
      ? {
          $or: [{ groups: { $in: groups } }, { user: user ? user : 'INVALID' }],
        }
      : { groups: { $in: groups } };
    FolderModel.find({ organization, ...conditions }, { secrets: 0 })
      .then((doc) => {
        resolve(doc);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

module.exports = {
  create,
  update,
  get,
  acessible,
  group: {
    purge: remove_group_all,
  },
};
