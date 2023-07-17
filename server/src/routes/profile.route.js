const Joi = require('joi');
const express = require('express');
const password = require('../helper/password.helper');
const userController = require('../controllers/user.controller');
const validateObjectId = require('../helper/objectId.validator');

const Router = express.Router();

// Retuurns logged in user information
Router.get('/', (req, res) => {
  userController
    .get(req.organization, req.user)
    .then((user) => {
      res.send({
        id: user._id,
        name: user.name,
        email: user.email,
        admin: user.admin,
        groups: user.groups,
        keys: user.keys.map((key) => {
          return {
            id: key._id,
            value: key.value,
          };
        }),
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});
// Add key to user
Router.post('/key', (req, res) => {
  const { error, value } = Joi.object({
    value: Joi.string().required(),
    device: Joi.string(),
  }).validate(req.body);

  if (error) {
    return res.status(400).send(error.details);
  }
  userController.key
    .add(req.organization, req.user, value.value, value.device)
    .then((result) => {
      res.send({
        id: result._id,
        value: result.value,
        device: result.device,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});
// Delete key from user
Router.delete('/key/:id', (req, res) => {
  const { error, value } = Joi.object({
    id: Joi.string().custom(validateObjectId).required(),
  }).validate(req.params);

  if (error) {
    return res.status(400).send(error.details);
  }

  userController.key
    .delete(req.user, value.id)
    .then(() => {
      res.send();
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});
// Change password
Router.post('/change-password', (req, res) => {
  const { value, error } = Joi.object({
    password: Joi.string().required(),
    newPassword: Joi.string().required(),
    confirmNewPassword: Joi.ref('newPassword'),
  }).validate(req.body);

  if (error) {
    return res.status(400).send(error.details);
  }

  userController
    .get(req.organization, req.user)
    .then((user) => {
      if (!user) {
        return res.status(401).send();
      }
      password
        .verify(value.password, user.password)
        .then((match) => {
          if (!match) {
            res.status(401).send();
          } else {
            userController
              .updatePassword(req.user, value.newPassword)
              .then(() => {
                res.send();
              })
              .catch((error) => {
                res.status(500).send();
                console.log(error);
              });
          }
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

module.exports = Router;
