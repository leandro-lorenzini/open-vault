const express = require('express');
const pjs = require('../../package.json');

const Router = express.Router();

Router.use('/', (req, res) => {
  const url = `https://github.com/leandro-lorenzini/open-vault/releases/download/v${pjs.version}`;

  return res.render('download', {
    mac:       process.env.MAC_INSTALLER || `${url}/open-vault-${pjs.version}-x64.dmg`,
    windows:   process.env.WINDOWS_INSTALLER || `${url}/open-vault-${pjs.version}.exe`,
    linux_deb: process.env.LINUX_DEB_INSTALLER || `${url}/open-vault_${pjs.version}_amd64.deb`,
    linux_rpm: process.env.LINUX_RPM_INSTALLER || `${url}/open-vault-${pjs.version}.x86_64.rpm`,
  });
  
});

module.exports = Router;
