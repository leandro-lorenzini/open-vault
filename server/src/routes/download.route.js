const express = require('express');
const pjs = require('../../package.json');

const Router = express.Router();

Router.use('/', (req, res) => {
  return res.render('download', {
    mac: process.env.MAC_INSTALLER,
    windows: process.env.WINDOWS_INSTALLER,
    linux: process.env.LINUX_INSTALLER,
    version: pjs.version,
  });
});

module.exports = Router;
