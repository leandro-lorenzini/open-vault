const FolderModel = require('../models/folder.model');

const mongoose = require('mongoose');

/**
 * Add a new secret and a vault for the user who is creating it.
 * @param {String} organization
 * @param {String} folder
 * @param {String} name
 * @param {String} url
 * @param {String} username
 * @param {String} user User's ID
 * @param {String} key User's public key ID used by the current device
 * @param {String} ciphertext Value encrypted by the client using user's public key
 * @param {Number} strength
 * @param {String} totp TOTP encrypted by the client using organization public key
 * @param {String} totpRecovery TOTP encrypted by the client using organization public key
 * @returns {Promise}
 */
function add(
  organization,
  folder,
  name,
  url,
  username,
  user,
  key,
  ciphertext,
  recovery,
  strength,
  totp,
  totpRecovery
) {
  return new Promise((resolve, reject) => {
    let secret = {
      _id: new mongoose.Types.ObjectId(),
      name,
      url,
      username,
      version: 0,
      strength,
      lastUpdated: Date.now(),
      vaults: [
        {
          _id: new mongoose.Types.ObjectId(),
          organizationOwned: true,
          ciphertext: recovery,
          totp: totpRecovery,
          version: 0,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          user,
          key,
          ciphertext,
          totp,
          version: 0,
        },
      ],
    };
    FolderModel.updateOne(
      { _id: folder, organization },
      { $addToSet: { secrets: secret } }
    )
      .then((result) => {
        if (result.modifiedCount) {
          secret.folder = folder;
          secret.id = secret._id;
          secret.vault = secret.vaults[0];
          resolve(secret);
        }
        reject(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Update a secret and the vault for the user who is updating the secret
 * @param {String} organization
 * @param {String} folder
 * @param {String} secret
 * @param {String} name
 * @param {String} url
 * @param {String} username
 * @param {String} user
 * @param {String} key
 * @param {String} ciphertext
 * @param {String} version
 * @param {String} recovery
 * @param {Number} strength
 * @param {String} totp
 * @param {String} totpRecovery
 * @returns {Promise}
 */
function update(
  organization,
  folder,
  secret,
  name,
  url,
  username,
  user,
  key,
  ciphertext,
  version,
  recovery,
  strength,
  totp,
  totprecovery,
  updatedVault
) {
  return new Promise((resolve, reject) => {
    // Get current vault
    let filter = { _id: folder, organization };
    let update = {
      $set: {
        'secrets.$[s].version': version,
        'secrets.$[s].name': name,
        'secrets.$[s].url': url,
        'secrets.$[s].username': username,
        'secrets.$[s].strength': strength,
        'secrets.$[s].vaults.$[v].ciphertext': ciphertext,
        'secrets.$[s].vaults.$[v].totp': totp,
        'secrets.$[s].vaults.$[v].version': version,
        'secrets.$[s].vaults.$[v].lastUpdated': Date.now(),
        // Organization vault
        'secrets.$[s].vaults.$[o].totp': totprecovery,
        'secrets.$[s].vaults.$[o].ciphertext': recovery,
        'secrets.$[s].vaults.$[o].version': version,
      },
    };
    if (updatedVault) {
      update.$set['secrets.$[s].lastUpdated'] = Date.now();
    }
    FolderModel.updateOne(filter, update, {
      arrayFilters: [
        {
          's._id': new mongoose.Types.ObjectId(secret),
        },
        {
          'v.user': new mongoose.Types.ObjectId(user),
          'v.key': new mongoose.Types.ObjectId(key),
        },
        {
          'o.organizationOwned': true,
        },
      ],
    })
      .then((result) => {
        if (result.modifiedCount) {
          resolve(secret);
        }
        reject(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Delete a secret and all its vaults
 * @param {String} organization
 * @param {String} folder
 * @param {String} secret
 * @returns {Promise}
 */
function remove(organization, folder, secret) {
  return new Promise((resolve, reject) => {
    FolderModel.updateOne(
      { _id: folder, organization },
      { $pull: { secrets: { _id: secret } } }
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
 * Get all secrets under a folder (No vaults included)
 * @param {String} organization
 * @param {String} folder
 * @param {String} secret
 * @returns {Promise}
 */
function get(organization, folder, secret) {
  return new Promise((resolve, reject) => {
    const pipeline = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(folder),
          organization: new mongoose.Types.ObjectId(organization),
        },
      },
      { $unwind: { path: '$secrets' } },
      { $match: { 'secrets._id': new mongoose.Types.ObjectId(secret) } },
      {
        $project: {
          folder: '$_id',
          _id: '$secrets._id',
          name: '$secrets.name',
          version: '$secrets.version',
          username: '$secrets.username',
          url: '$secrets.url',
        },
      },
    ];

    FolderModel.aggregate(pipeline)
      .then((docs) => {
        resolve(docs?.length ? docs[0] : []);
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
    FolderModel.find({ organization, ...conditions })
      .then((doc) => {
        resolve(doc);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * Get all folders under an organization and their secrets.
 * @param {String} organization
 * @returns {Promise}
 */
function all(organization) {
  return new Promise((resolve, reject) => {
    FolderModel.find({ organization })
      .then((doc) => {
        resolve(doc);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
/**
 * Gets a list of weak passwords
 * @param {String} organization
 * @returns {Promise<[]>}
 */
function get_weak(organization) {
  return new Promise((resolve, reject) => {
    FolderModel.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organization) } },
      { $unwind: '$secrets' },
      { $match: { 'secrets.strength': { $lt: 1 } } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          'secrets.folderName': '$name',
          'secrets.folderId': '$_id',
          'secrets.userEmail': { $ifNull: ['$user.email', null] },
          'secrets.userName': { $ifNull: ['$user.name', null] },
        },
      },
      { $replaceRoot: { newRoot: '$secrets' } },
    ])
      .then((docs) => {
        resolve(docs);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * Gets a list of old passwords
 * @param {String} organization
 * @returns {Promise<[]>}
 */
function get_old(organization) {
  return new Promise((resolve, reject) => {
    const hundredDays = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
    FolderModel.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(organization) } },
      { $unwind: '$secrets' },
      { $match: { 'secrets.lastUpdated': { $lte: hundredDays } } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          'secrets.folderName': '$name',
          'secrets.folderId': '$_id',
          'secrets.userEmail': { $ifNull: ['$user.email', null] },
          'secrets.userName': { $ifNull: ['$user.name', null] },
        },
      },
      { $replaceRoot: { newRoot: '$secrets' } },
    ])
      .then((docs) => {
        resolve(docs);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function move(secret, source, destination) {
  return new Promise(async (resolve, reject) => {
    try {
      // Get document
      let document = await FolderModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(source) } },
        { $unwind: '$secrets' },
        { $match: { 'secrets._id': new mongoose.Types.ObjectId(secret) } },
        { $replaceRoot: { newRoot: '$secrets' } },
      ]);

      if (!document?.length) {
        return reject('Could not find secret');
      }
      document = document[0];

      // Add document to new destination folder
      let addition = await FolderModel.updateOne(
        { _id: destination },
        { $addToSet: { secrets: document } }
      );

      if (!addition.modifiedCount) {
        return reject('Secret not created under new folder');
      }
      // Add document to new destination folder
      let removal = await FolderModel.updateOne(
        { _id: source },
        { $pull: { secrets: { _id: secret } } }
      );

      if (!removal.modifiedCount) {
        return reject(
          'Secret added to destination but not removed from source'
        );
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  add,
  update,
  remove,
  get,
  acessible,
  get_weak,
  get_old,
  all,
  move,
};
