const Joi = require('joi');
const express = require('express');
const folderController = require('../controllers/folder.controller');
const secretsRoute = require('./secrets.route');
const validateObjectId = require('../helper/objectId.validator');

const Router = express.Router({ mergeParams: true });

Router.use('/:folderId/secrets', secretsRoute);
Router.use('/secrets', secretsRoute);

Router.post('/', (req, res) => {
  const { error, value } = Joi.object({
    name: Joi.string().required(),
    groups: Joi.array().items(Joi.string().custom(validateObjectId)),
  }).validate(req.body);

  if (error) {
    return res.status(400).send(error.details);
  }

  folderController
    .create(req.organization, value.name, value.groups)
    .then((result) => {
      res.send({
        id: result._id,
        organization: result.organization,
        name: result.name,
        groups: result.groups,
        user: result.user,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});
Router.patch('/:folderId', (req, res) => {
  const { error, value } = Joi.object({
    name: Joi.string().required(),
    groups: Joi.array().items(Joi.string().custom(validateObjectId)),
    folderId: Joi.string().custom(validateObjectId).required(),
  }).validate({ ...req.body, ...req.params });

  if (error) {
    return res.status(400).send(error.details);
  }

  folderController
    .update(req.organization, value.folderId, value.name, value.groups)
    .then(() => {
      res.send({
        id: value.folderId,
        name: value.name,
        groups: value.groups,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});
Router.get('/', (req, res) => {
  folderController
    .get(req.organization)
    .then((folders) => {
      res.send(
        folders
          .filter((folder) => !folder.user)
          .map((folder) => {
            return {
              id: folder._id,
              name: folder.name,
              groups: folder.groups,
            };
          })
      );
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});
Router.get('/all', (req, res) => {
  folderController
    .get(req.organization)
    .then((folders) => {
      res.send(
        folders.map((folder) => {
          return {
            id: folder._id,
            name: folder.name,
            user: folder.user,
            groups: folder.groups,
          };
        })
      );
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});
module.exports = Router;
