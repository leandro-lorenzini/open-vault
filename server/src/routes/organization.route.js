const express = require('express');
const organization = require('../controllers/organization.controller');
const Joi = require('joi');
const isAdmin = require('../helper/admin.middleware');
const validateObjectId = require('../helper/objectId.validator');
const { hash } = require('../helper/password.helper');

const Router = express.Router();

Router.get('/', (req, res) => {
  organization
    .get(req.organization)
    .then(async (org) => {
      res.send({
        id: org._id,
        name: org.name,
        key: org.key,
        sso: org.sso,
        smtp: {
          server: org.smtp.server,
          port: org.smtp.port,
          secure: org.smtp.secure,
          username: org.smtp.username,
          password: await hash(org.smtp.password),
        },
        groups: org.groups.map((group) => {
          return {
            id: group._id,
            name: group.name,
            admin: group.admin,
          };
        }),
      });
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});
Router.post('/group', isAdmin, (req, res) => {
  const { value, error } = Joi.object({
    name: Joi.string().required(),
    admin: Joi.boolean().required(),
  }).validate(req.body);

  if (error) {
    return res.status(400).send(error.details);
  }

  organization.group
    .add(req.organization, value.name, value.admin)
    .then((result) => {
      if (result.existing) {
        res.status(400).send('Group already exists');
      }
      res.send({
        id: result._id,
        name: result.name,
        admin: result.admin,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});
Router.patch('/group/:groupId', isAdmin, (req, res) => {
  const { value, error } = Joi.object({
    name: Joi.string().required(),
    admin: Joi.boolean().required(),
    groupId: Joi.string().custom(validateObjectId),
  }).validate({ ...req.body, ...req.params });

  if (error) {
    return res.status(400).send(error.details);
  }

  organization.group
    .update(req.organization, value.groupId, value.name, value.admin)
    .then(() => {
      res.send({
        id: value.groupId,
        name: value.name,
        admin: value.admin,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});
Router.delete('/group/:groupId', isAdmin, (req, res) => {
  organization.group
    .remove(req.organization, req.params.groupId)
    .then(() => {
      res.send();
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});
Router.put('/sso', isAdmin, (req, res) => {
  const { value, error } = Joi.object({
    enabled: Joi.boolean().required(),
    issuer: Joi.string(),
    entryPoint: Joi.string(),
    certificate: Joi.string(),
  }).validate(req.body);

  if (error) {
    return res.status(400).send(error.details);
  }

  organization.sso
    .set(
      req.organization,
      value.enabled,
      value.issuer,
      value.entryPoint,
      value.certificate
    )
    .then((result) => {
      res.send(result);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});
Router.put('/smtp', isAdmin, (req, res) => {
  const { value, error } = Joi.object({
    server: Joi.string().required(),
    port: Joi.number().required(),
    secure: Joi.boolean().required(),
    username: Joi.string().required(),
    password: Joi.string().required(),
  }).validate(req.body);

  if (error) {
    return res.status(400).send(error.details);
  }

  organization
    .get(req.organization)
    .then(async (org) => {
      let password =
        hash(org.smtp.password) === hash(value.password)
          ? org.smtp.password
          : value.password;

      organization.smtp
        .set(
          req.organization,
          value.server,
          value.port,
          value.secure,
          value.username,
          password
        )
        .then((result) => {
          res.send(result);
        })
        .catch((error) => {
          console.log(error);
          res.status(500).send(error);
        });
    })
    .catch((error) => {
      res.status(500).send();
      console.log(error);
    });
});

module.exports = Router;
