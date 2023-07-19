const express = require('express');
const userController = require('../controllers/user.controller');
const Joi = require('joi');
const validateObjectId = require('../helper/objectId.validator');
const isAdmin = require('../helper/admin.middleware');

const Router = express.Router();

Router.post('/', isAdmin, (req, res) => {
  const { error, value } = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email(),
    groups: Joi.array().items(Joi.string().custom(validateObjectId)),
  }).validate(req.body);

  if (error) {
    return res.status(400).json(error.details);
  }

  userController
    .create(
      req.organization,
      value.name,
      value.email,
      null,
      false,
      value.groups
    )
    .then((result) => {
      res.send({
        id: result._id,
        name: result.name,
        email: result.email,
        admin: result.admin,
        groups: result.groups,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
});
Router.patch('/:userId', isAdmin, (req, res) => {
  const { error, value } = Joi.object({
    userId: Joi.string().custom(validateObjectId).required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    groups: Joi.array().items(Joi.string().custom(validateObjectId)),
    active: Joi.boolean().required(),
  }).validate({ ...req.body, ...req.params });

  if (error) {
    return res.status(400).json(error.details);
  }

  userController
    .update(
      req.organization,
      value.userId,
      value.name,
      value.email,
      value.groups,
      value.active
    )
    .then(() => {
      res.send({
        id: value.userId,
        name: value.name,
        email: value.email,
        groups: value.groups,
        active: value.active,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
});
Router.get('/', (req, res) => {
  userController
    .all(req.organization)
    .then((result) => {
      res.send(
        result.map((user) => {
          return {
            id: user._id,
            name: user.name,
            email: user.email,
            admin: user.admin,
            groups: user.groups,
            sso: user.sso,
            active: user.active,
            keys: user.keys.map((key) => {
              return {
                id: key._id,
                value: key.value,
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
});

module.exports = Router;
