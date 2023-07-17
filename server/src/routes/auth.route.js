const express = require('express');
const Joi = require('joi');
const userController = require('../controllers/user.controller');
const password = require('../helper/password.helper');
const passwordValidator = require('password-validator');
const organizationController = require('../controllers/organization.controller');
const { sendEmail } = require('../helper/sendEmail');

const Router = express.Router();

Router.use('/sso', require('./sso.route'));

Router.post('/signup', async (req, res) => {
  const { error, value } = Joi.object({
    organizationName: Joi.string().required(),
    key: Joi.string().required(),
    fullname: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }).validate(req.body);

  if (error) {
    return res.status(400).send(error.details);
  }

  try {
    // Make sure that user doesn't already exist.
    let user = await userController.find(value.email);
    if (user) {
      return res.status(409).send('User already registered');
    }

    // Create the organization
    const org = await organizationController.create(
      value.organizationName,
      value.key
    );

    // Create Admin group
    const group = await organizationController.group.add(
      org._id,
      'Administrators',
      true
    );

    // Create the user
    const hash = await password.hash(value.password);
    user = await userController.create(
      org._id,
      value.fullname,
      value.email,
      hash,
      true,
      [group._id]
    );
    req.session.user = {
      id: user._id,
      organization: org._id,
      groups: user.groups,
      sso: false,
    };

    req.session.save(() => {
      res.send(req.session.user);
    });
  } catch (error) {
    console.log(error);
    res.status(500).send();
  }
});

Router.post('/', (req, res) => {
  const { value, error } = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }).validate(req.body);

  if (error) {
    return res.status(400).send(error.details);
  }

  userController
    .find(value.email)
    .then((user) => {
      if (!user) {
        return res.status(401).send();
      }
      password
        .verify(value.password, user.password)
        .then((match) => {
          if (match) {
            if (!user.active) {
              return res.status(301).send();
            }
            req.session.user = {
              id: user._id,
              organization: user.organization,
              groups: user.groups,
              sso: user.sso ? true : false,
            };
            req.session.save(() => {
              res.send(req.session.user);
            });
          } else {
            res.status(401).send();
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

Router.get('/', (req, res) => {
  if (req.session.user) {
    res.send(req.session.user);
  } else {
    res.status(301).send({ code: 'NotAuthenticated' });
  }
});

Router.delete('/', (req, res) => {
  req.session.destroy();
  res.send();
});

Router.get('/activate', (req, res) => {
  const { value, error } = Joi.object({
    token: Joi.string().required(),
    email: Joi.string().email().required(),
  }).validate(req.query);

  if (error) {
    return res.render('activation', { errorCode: 400 });
  }

  userController.token
    .get(value.email, value.token, 'activation')
    .then((token) => {
      if (!token) {
        return res.render('activation', { errorCode: 301, email: value.email });
      }
      res.render('activation', { email: value.email });
    })
    .catch((error) => {
      console.log(error);
      res.render('activation', { errorCode: 500 });
    });
});

Router.post('/activate', (req, res) => {
  const { value, error } = Joi.object({
    email: Joi.string().email().required().label('E-mail'),
    token: Joi.string().required().label('Token'),
    password: Joi.string().required().label('Password'),
    confirmPassword: Joi.ref('password'),
  }).validate({ ...req.query, ...req.body });

  const errors = new passwordValidator()
    .is()
    .min(8)
    .has()
    .uppercase()
    .has()
    .lowercase()
    .has()
    .digits()
    .validate(value.password, { details: true });

  if (error) {
    return res.render('activation', {
      email: value.email,
      errorCode: 400,
      messages:
        error.details[0].path[0] === 'confirmPassword'
          ? [
              {
                message:
                  'The password and password confirmation fields do not match',
              },
            ]
          : error.details,
    });
  }

  if (errors.length) {
    console.log(errors);
    return res.render('activation', {
      email: value.email,
      errorCode: 400,
      messages: errors,
    });
  }

  userController
    .find(value.email)
    .then((user) => {
      if (!user) {
        return res.status(401).send();
      }

      const tokens = user.tokens.filter((token) => {
        return !!(
          token.value === value.token &&
          !token.consumed &&
          new Date() - new Date(token.date) < 12 * 60 * 60 * 1000
        );
      });

      if (!tokens.length) {
        res.status(401).send();
        return res.render('activation', { errorCode: 401 });
      } else {
        userController
          .updatePassword(user._id, value.password)
          .then(() => {
            req.session.user = {
              id: user._id,
              organization: user.organization,
              groups: user.groups,
              sso: user.sso ? true : false,
            };
            req.session.save(() => {
              return res.redirect('/download');
            });
            // Consume token
            userController.token
              .consume(user._id, tokens[0]._id)
              .catch((error) => {
                console.log(error);
              });
          })
          .catch((error) => {
            console.log(error);
            return res.status(500).send();
          });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
});

Router.put('/reset-password', (req, res) => {
  const { error, value } = Joi.object({
    email: Joi.string().email().required(),
  }).validate(req.body);

  if (error) {
    return res.status(400).send(error.details);
  }

  userController.find(value.email).then((user) => {
    setTimeout(() => {
      if (!user) {
        res.send();
      } else {
        userController.token
          .add(user.organization, user._id, 'reset')
          .then((token) => {
            sendEmail(
              user.organization,
              user.email,
              'Reset your password',
              'reset-password-email',
              {
                name: user.name,
                email: user.email,
                token,
              }
            );
            res.send();
          })
          .catch((error) => {
            console.log(error);
            res.status(500).send();
          });
      }
    }, Math.floor(Math.random() * (3000 - 500 + 1)) + 3000);
  });
});

Router.get('/reset-password', (req, res) => {
  const { value, error } = Joi.object({
    email: Joi.string().email().required().label('E-mail'),
    token: Joi.string().required().label('Token'),
  }).validate({ ...req.query, ...req.body });

  if (error) {
    return res.render('reset-password', {
      email: value.email,
      errorCode: 400,
      messages: error.details,
    });
  }

  userController.token
    .get(value.email, value.token, 'reset')
    .then((token) => {
      if (!token) {
        return res.render('reset-password', {
          errorCode: 301,
          email: value.email,
        });
      }
      res.render('reset-password', { email: value.email });
    })
    .catch((error) => {
      console.log(error);
      res.render('reset-password', { errorCode: 500 });
    });
});

Router.post('/reset-password', (req, res) => {
  const { value, error } = Joi.object({
    email: Joi.string().email().required().label('E-mail'),
    token: Joi.string().required().label('Token'),
    password: Joi.string().required().label('Password'),
    confirmPassword: Joi.ref('password'),
  }).validate({ ...req.query, ...req.body });

  const errors = new passwordValidator()
    .is()
    .min(8)
    .has()
    .uppercase()
    .has()
    .lowercase()
    .has()
    .digits()
    .validate(value.password, { details: true });

  if (error) {
    return res.render('reset-password', {
      email: value.email,
      errorCode: 400,
      messages:
        error.details[0].path[0] === 'confirmPassword'
          ? [
              {
                message:
                  'The password and password confirmation fields do not match',
              },
            ]
          : error.details,
    });
  }

  if (errors.length) {
    console.log(errors);
    return res.render('reset-password', {
      email: value.email,
      errorCode: 400,
      messages: errors,
    });
  }

  userController.token
    .get(value.email, value.token, 'reset')
    .then((user) => {
      if (!user) {
        return res.render('reset-password', {
          errorCode: 301,
          email: value.email,
        });
      }

      userController.token
        .consume(user._id, user.tokens._id)
        .then(() => {
          userController
            .updatePassword(user._id, value.password)
            .then(() => {
              res.render('reset-password-success');
            })
            .catch((error) => {
              res.render('reset-password', {
                messages: [{ message: 'A technical error has happened' }],
              });
              console.log(error);
            });
        })
        .catch((error) => {
          console.log(error);
          res.render('reset-password', { errorCode: 500 });
        });
    })
    .catch((error) => {
      console.log(error);
      res.render('reset-password', { errorCode: 500 });
    });
});

module.exports = Router;
