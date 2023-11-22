const express = require('express');
const pjs = require('../../package.json');

const Router = express.Router();

Router.use('/', (req, res) => {
  const url = `https://github.com/leandro-lorenzini/open-vault/releases/download/v${pjs.version}`;

  return res.render('download', {
    mac: process.env.MAC_INSTALLER || `${url}/OpenVault-${pjs.version}.dmg`,
    windows:
      process.env.WINDOWS_INSTALLER || `${url}/OpenVault-${pjs.version}.exe`,
    linux_deb:
      process.env.LINUX_DEB_INSTALLER || `${url}/OpenVault_${pjs.version}.deb`,
    linux_rpm:
      process.env.LINUX_RPM_INSTALLER || `${url}/OpenVault-${pjs.version}.rpm`,
  });
});

module.exports = Router;
