const nodemailer = require('nodemailer');
const pug = require('pug');
const path = require('path');
const organizationController = require('../controllers/organization.controller');

async function sendEmail(org, to, subject, template, data) {
  try {
    let organization = await organizationController.get(org);

    if (!organization.smtp?.server) {
      console.log('SMTP server not configured yet.');
      return false;
    }

    let transporter = nodemailer.createTransport({
      host: organization.smtp.server,
      port: organization.smtp.port,
      secure: organization.smtp.secure, // true for 465, false for other ports
      auth: {
        user: organization.smtp.username,
        pass: organization.smtp.password,
      },
    });

    // Making sure that URL end in '/'
    let APP_URL = process.env.URL;
    if (APP_URL.slice(-1) !== '/') {
      APP_URL = APP_URL + '/';
    }

    // eslint-disable-next-line xss/no-mixed-html
    const html = pug.renderFile(
      path.join(__dirname, `../views/${template}.pug`),
      { ...data, APP_URL }
    );

    let info = await transporter.sendMail({
      from: organization.smtp.username,
      to,
      subject,
      html,
    });

    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.log(error);
  }
}

module.exports = { sendEmail };
