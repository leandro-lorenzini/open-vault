const Joi = require('joi');
const express = require('express');
const secretController = require('../controllers/secret.controller');
const vaultController = require('../controllers/vault.controller');
const userController = require('../controllers/user.controller');
const validateObjectId = require('../helper/objectId.validator');

const Router = express.Router({ mergeParams: true });

Router.patch('/move', (req, res) => {
  const { error, value } = Joi.object({
    source: Joi.string().custom(validateObjectId).required(),
    destination: Joi.string().custom(validateObjectId).required(),
    secret: Joi.string().custom(validateObjectId).required(),
  }).validate(req.body);

  if (error) {
    return res.status(400).json(error.details);
  }

  secretController
    .move(value.secret, value.source, value.destination)
    .then(() => {
      res.send();
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
});

Router.post('/', (req, res) => {
  const { error, value } = Joi.object({
    folderId: Joi.string().custom(validateObjectId),
    name: Joi.string().required(),
    url: Joi.string(),
    username: Joi.string(),
    key: Joi.string().custom(validateObjectId),
    ciphertext: Joi.string().required(),
    recovery: Joi.string().required(),
    strength: Joi.number().required(),
    totp: Joi.string().allow(''),
    totpRecovery: Joi.string().allow(''),
  }).validate({ ...req.body, ...req.params });

  if (error) {
    return res.status(400).json(error.details);
  }

  secretController
    .add(
      req.organization,
      value.folderId,
      value.name,
      value.url,
      value.username,
      req.user,
      value.key,
      value.ciphertext,
      value.recovery,
      value.strength,
      value.totp,
      value.totpRecovery
    )
    .then((secret) => {
      delete secret._id;
      secret.vaults.map((vault) => {
        return {
          id: vault._id,
          organizationOwned: vault.organizationOwned,
          ciphertext: vault.ciphertext,
          totp: vault.totp,
          version: vault.version,
        };
      });
      res.send({
        id: secret._id,
        name: secret.name,
        folder: value.folderId,
        username: secret.username,
        url: secret.url,
        version: secret.version,
        vault: secret.vaults
          .filter((vault) => vault.key === value.key)
          .map((vault) => {
            return {
              id: vault._id,
              user: vault.user,
              key: vault.key,
              ciphertext: vault.ciphertext,
              totp: vault.totp,
              version: vault.version,
            };
          })[0],
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
});
Router.delete('/:secretId', (req, res) => {
  const { error, value } = Joi.object({
    folderId: Joi.string().custom(validateObjectId),
    secretId: Joi.string().custom(validateObjectId),
  }).validate({ ...req.params });

  if (error) {
    return res.status(400).json(error.details);
  }

  secretController
    .remove(req.organization, value.folderId, value.secretId)
    .then(() => {
      res.send();
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
});
Router.patch('/:secretId', (req, res) => {
  const { error, value } = Joi.object({
    folderId: Joi.string().custom(validateObjectId),
    secretId: Joi.string().custom(validateObjectId),
    name: Joi.string().required(),
    url: Joi.string(),
    username: Joi.string(),
    key: Joi.string().custom(validateObjectId),
    ciphertext: Joi.string().required(),
    recovery: Joi.string().required(),
    version: Joi.number().required(),
    strength: Joi.number().required(),
    updatedVault: Joi.boolean(),
    totp: Joi.string().allow(''),
    totpRecovery: Joi.string().allow(''),
  }).validate({ ...req.body, ...req.params });

  if (error) {
    return res.status(400).json(error.details);
  }

  secretController
    .get(req.organization, req.params.folderId, req.params.secretId)
    .then((secret) => {
      if (req.body.version <= secret.version) {
        res.status(409).send();
      } else {
        secretController
          .update(
            req.organization,
            value.folderId,
            value.secretId,
            value.name,
            value.url,
            value.username,
            req.user,
            value.key,
            value.ciphertext,
            value.version,
            value.recovery,
            value.strength,
            value.totp,
            value.totpRecovery,
            value.updatedVault
          )
          .then(() => {
            res.send({
              id: value.secretId,
              folder: value.folderId,
              name: value.name,
              username: value.username,
              url: value.url,
              version: value.version,
              strength: value.strength,
              vault: {
                organizationOwned: false,
                user: req.user,
                key: value.key,
                ciphertext: value.ciphertext,
                totp: value.totp,
                version: value.version,
              },
            });
            // Remove unused vaults
            vaultController
              .inaccessible(req.organization, value.folderId, value.secretId)
              .then((folders) => {
                if (
                  folders?.[0] &&
                  folders?.[0].secrets &&
                  folders?.[0].secrets[0].vaults?.length
                ) {
                  vaultController
                    .remove(
                      req.organization,
                      value.folderId,
                      value.secretId,
                      folders[0].secrets[0].vaults.map((v) => v._id)
                    )
                    .catch((error) => {
                      console.log(error);
                    });
                }
              })
              .catch((error) => {
                console.log(error);
              });
          })
          .catch((error) => {
            console.log(error);
            res.status(500).send();
          });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
});
Router.post('/:secretId/vault', (req, res) => {
  const { error, value } = Joi.object({
    folderId: Joi.string().custom(validateObjectId),
    secretId: Joi.string().custom(validateObjectId),
    user: Joi.string().custom(validateObjectId),
    key: Joi.string().custom(validateObjectId),
    ciphertext: Joi.string().required(),
    totp: Joi.string().allow(''),
    version: Joi.number().required(),
  }).validate({ ...req.body, ...req.params });

  if (error) {
    return res.status(400).json(error.details);
  }

  secretController
    .get(req.organization, req.params.folderId, req.params.secretId)
    .then((secret) => {
      if (req.body.version !== secret.version) {
        res.status(409).send();
      } else {
        vaultController
          .add(
            req.organization,
            value.folderId,
            value.secretId,
            value.user,
            value.key,
            value.ciphertext,
            value.totp,
            value.version
          )
          .then((vault) => {
            res.send({
              id: vault._id,
              user: vault.user,
              folder: value.folderId,
              key: vault.key,
              ciphertext: vault.ciphertext,
              totp: vault.totp,
              version: vault.version,
            });
          })
          .catch((error) => {
            console.log(error);
            res.status(500).send();
          });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
});
Router.patch('/:secretId/vault', (req, res) => {
  const { error, value } = Joi.object({
    folderId: Joi.string().custom(validateObjectId).required(),
    secretId: Joi.string().custom(validateObjectId).required(),
    user: Joi.string().custom(validateObjectId).required(),
    key: Joi.string().custom(validateObjectId).required(),
    ciphertext: Joi.string().required().required(),
    totp: Joi.string().allow(''),
    version: Joi.number().required().required(),
  }).validate({ ...req.body, ...req.params });

  if (error) {
    return res.status(400).json(error.details);
  }

  secretController
    .get(req.organization, req.params.folderId, req.params.secretId)
    .then((secret) => {
      if (req.body.version !== secret.version) {
        res.status(409).send();
      } else {
        vaultController
          .update(
            req.organization,
            value.folderId,
            value.secretId,
            value.user,
            value.key,
            value.ciphertext,
            value.totp,
            value.version
          )
          .then(() => {
            res.send({
              folderId: value.folderId,
              secretId: value.secretId,
              user: value.user,
              key: value.key,
              value: value.ciphertext,
              totp: value.totp,
              version: value.version,
            });
          })
          .catch((error) => {
            console.log(error);
            res.status(500).send();
          });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
});
// eslint-disable-next-line sonarjs/cognitive-complexity
Router.get('/key/:key', (req, res) => {
  const { error, value } = Joi.object({
    key: Joi.string().custom(validateObjectId),
  }).validate(req.params);

  if (error) {
    return res.status(400).json(error.details);
  }

  userController.get(req.organization, req.user).then((user) => {
    secretController
      .acessible(user.organization, user.groups, user._id)
      .then((folders) => {
        const secrets = [];

        for (let folder of folders) {
          for (let secret of folder.secrets) {
            let item = {
              id: secret._id,
              folder: folder._id,
              name: secret.name,
              username: secret.username,
              url: secret.url,
              version: secret.version,
              vault: {},
              strength: secret.strength,
            };
            for (let vault of secret.vaults) {
              if (vault.key?.toString() === value.key) {
                item.vault = {
                  id: vault._id,
                  key: vault.key,
                  user: vault.user,
                  ciphertext: vault.ciphertext,
                  totp: vault.totp,
                  version: vault.version,
                };
              }
            }
            secrets.push(item);
          }
        }
        res.send(secrets);
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send();
      });
  });
});
// eslint-disable-next-line sonarjs/cognitive-complexity
Router.get('/sync/:recovery?', async (req, res) => {
  try {
    let missing = [];
    let outdated = [];

    if (req.params.recovery) {
      let users = await userController.all(req.organization);
      let folders = await secretController.all(req.organization);
      for (let folder of folders) {
        for (let secret of folder.secrets) {
          // Check for missing vaults
          let keys = secret.vaults
            .filter((vault) => vault.key) // Making sure it's not an organization key
            .map((vault) => vault.key.toString());

          for (let user of users) {
            let accessible = user.groups.filter((groupId) =>
              folder.groups?.includes(groupId)
            );

            if (
              accessible.length ||
              folder.user.toString() === user._id.toString()
            ) {
              for (let key of user.keys) {
                if (!keys.includes(key._id.toString())) {
                  missing.push({
                    secret: secret._id,
                    user: user._id,
                    key: key._id,
                  });
                }
              }
            }
          }

          // Check for outdated vaults
          outdated = outdated.concat(
            secret.vaults
              .filter((vault) => vault.version < secret.version)
              .map((vault) => {
                return {
                  secret: secret._id,
                  user: vault.user,
                  key: vault.key,
                  version: vault.version,
                };
              })
          );
        }
      }
      res.send({ missing, outdated });
    } else {
      // Get current user's group membership
      let user = await userController.get(req.organization, req.user);
      let groups = user.groups;

      for (let group of groups) {
        let users = await userController.all(req.organization);
        let folders = await secretController.acessible(
          user.organization,
          group,
          req.user
        );

        for (let folder of folders) {
          for (let secret of folder.secrets) {
            // Check for missing vaults
            let keys = secret.vaults
              .filter((vault) => vault.key) // Making sure it's not an organization key
              .map((vault) => vault.key.toString());

            for (let user of users) {
              let accessible = user.groups.filter((groupId) =>
                folder.groups?.includes(groupId)
              );

              if (
                accessible.length ||
                folder.user?.toString() === user._id.toString()
              ) {
                for (let key of user.keys) {
                  if (!keys.includes(key._id.toString())) {
                    missing.push({
                      secret: secret._id,
                      user: user._id,
                      key: key._id,
                    });
                  }
                }
              }
            }

            // Check for outdated vaults
            outdated = outdated.concat(
              secret.vaults
                .filter((vault) => vault.version < secret.version)
                .map((vault) => {
                  return {
                    secret: secret._id,
                    user: vault.user,
                    key: vault.key,
                    version: vault.version,
                  };
                })
            );
          }
        }
      }
      res.send({ missing, outdated });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send();
  }
});
Router.get('/vault/inaccessible', (req, res) => {
  vaultController
    .inaccessible(req.organization)
    .then((result) => {
      res.send(result);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
});
Router.get('/user/:userId', (req, res) => {
  userController
    .get(req.organization, req.params.userId)
    .then((user) => {
      secretController
        .acessible(user.organization, user.groups, user._id)
        .then((folders) => {
          res.send(
            folders.map((folder) => {
              return {
                id: folder._id,
                name: folder.name,
                groups: folder.groups,
                secrets: folder.secrets.map((secret) => {
                  return {
                    id: secret._id,
                    name: secret.name,
                    username: secret.username,
                    version: secret.version,
                    strength: secret.strength,
                    vaults: secret.vaults?.map((vault) => {
                      return {
                        id: vault._id,
                        organizationOwned: vault.organizationOwned,
                        user: vault.user,
                        key: vault.key,
                        ciphertext: vault.ciphertext,
                        totp: vault.totp,
                        version: vault.version,
                      };
                    }),
                  };
                }),
              };
            })
          );
        })
        .catch((error) => {
          console.log(error);
          res.status(500).send();
        });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
});
Router.get('/user/', (req, res) => {
  userController
    .get(req.organization, req.user)
    .then((user) => {
      secretController
        .acessible(user.organization, user.groups, user._id)
        .then((folders) => {
          res.send(
            folders.map((folder) => {
              return {
                id: folder._id,
                name: folder.name,
                groups: folder.groups,
                user: folder.user,
                secrets: folder.secrets.map((secret) => {
                  return {
                    id: secret._id,
                    name: secret.name,
                    username: secret.username,
                    version: secret.version,
                    strength: secret.strength,
                    vaults: secret.vaults?.map((vault) => {
                      return {
                        id: vault._id,
                        organizationOwned: vault.organizationOwned,
                        user: vault.user,
                        key: vault.key,
                        ciphertext: vault.ciphertext,
                        totp: vault.totp,
                        version: vault.version,
                      };
                    }),
                  };
                }),
              };
            })
          );
        })
        .catch((error) => {
          console.log(error);
          res.status(500).send();
        });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
});
Router.get('/weak', (req, res) => {
  secretController
    .get_weak(req.organization)
    .then((result) => {
      res.send(result);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
});
Router.get('/old', (req, res) => {
  secretController
    .get_old(req.organization)
    .then((result) => {
      res.send(result);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
});
Router.get('/recovery', (req, res) => {
  userController.get(req.organization, req.user).then((user) => {
    secretController
      .all(user.organization)
      .then((folders) => {
        const secrets = [];

        for (let folder of folders) {
          for (let secret of folder.secrets) {
            let item = {
              id: secret._id,
              folder: folder._id,
              name: secret.name,
              username: secret.username,
              url: secret.url,
              version: secret.version,
              vault: {},
              strength: secret.strength,
            };
            for (let vault of secret.vaults) {
              if (vault.organizationOwned) {
                item.vault = {
                  id: vault._id,
                  ciphertext: vault.ciphertext,
                  totp: vault.totp,
                  version: vault.version,
                };
              }
            }
            secrets.push(item);
          }
        }
        res.send(secrets);
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send();
      });
  });
});

module.exports = Router;
