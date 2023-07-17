const express = require('express');

const Router = express.Router();

Router.use('/', (req, res) => {
  return res.render('download', {
    mac: process.env.MAC_INSTALLER,
    windows: process.env.WINDOWS_INSTALLER,
    linux: process.env.LINUX_INSTALLER,
    version: process.env.INSTALLER_VERSION,
  });
});

module.exports = Router;
