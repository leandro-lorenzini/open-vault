const express = require('express');
const organizationController = require('../controllers/organization.controller');

const Router = express.Router();

Router.get('/', (req, res) => {
  organizationController
    .find()
    .then((doc) => {
      if (!doc) {
        return res.json({ active: false });
      }
      res.json({
        active: true,
        id: doc._id,
        sso: doc.sso?.enabled ? true : false,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
});

module.exports = Router;
