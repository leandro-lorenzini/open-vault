const express = require('express');
const passport = require('passport');
const SamlStrategy = require('@node-saml/passport-saml').Strategy;
const organizationController = require('../controllers/organization.controller');
const userController = require('../controllers/user.controller');

const Router = express.Router();

// Loads strategy from database (Organization collection)
Router.use(async (req, res, next) => {
  try {
    // Fetch the strategy config from the database
    let organization = await organizationController.find();

    if (!organization.sso.enabled) {
      throw new Error('No SAML strategy config found');
    }

    // Configure the SAML strategy
    const samlStrategy = new SamlStrategy(
      {
        path: `/auth/sso/callback`,
        entryPoint: organization.sso.entryPoint,
        issuer: organization.sso.issuer,
        cert: organization.sso.certificate,
        wantAuthnResponseSigned: organization.sso.responseSigned || false,
        wantAssertionsSigned: organization.sso.assertionSigned || false,
        audience: 'open-vault'
      },
      (profile, done) => done(null, profile)
    );

    // Register the strategy
    passport.use('saml', samlStrategy);

    // Continue to the next middleware
    next();
  } catch (err) {
    // If something went wrong, send an error response
    res.status(500).json({ error: err.message });
  }
});

// Creates a new token to track SSO authentication
Router.get('/request/:org', (req, res) => {
  organizationController.token
    .add(req.params.org, 'sso')
    .then((token) => {
      res.json({ token });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
});

// Checks the status of an authentication tolen (pending, error, success)
Router.post('/request/:org', (req, res) => {
  organizationController.token
    .get(req.params.org, req.body.token, 'sso')
    .then((token) => {
      if (token) {
        if (token.status === 'success' && token.user) {
          userController
            .get(req.params.org, token.user)
            .then((user) => {
              req.session.user = {
                id: user._id,
                organization: user.organization,
                groups: user.groups,
                sso: user.sso,
              };
              req.session.save(() => {
                res.send(req.session.user);
              });
            })
            .catch((error) => {
              console.log(error);
              res.send({ status: 'error' });
            });
        } else {
          res.send({ status: token.status });
        }
      } else {
        console.log('No token found');
        res.send({ status: 'error' });
      }
    })
    .catch((error) => {
      console.log(error);
      res.send({ status: error });
    });
});

/* 
  Redirects the user to the identity provider.
  Token previously created is sent to the idp as RelayState
*/
Router.get('/login/:org/:token', (req, res, next) => {
  passport.authenticate('saml', {
    additionalParams: {
      RelayState: req.params.token,
    },
    failureRedirect: '/auth/sso/fail',
  })(req, res, next);
});

/* 
  Callback URL
  The Identity provider will call this url with the authentication result.
  It also returns the RelayState so that we can update the authenticationtoken status.
*/
Router.post(
  '/callback/:org',
  passport.authenticate('saml', {
    failureRedirect: '/auth/sso/fail/',
    session: false,
  }),
  (req, res) => {
    // Look for the token sent back by the Identity  provider
    organizationController.token
      .get(req.params.org, req.body.RelayState, 'sso')
      // eslint-disable-next-line sonarjs/cognitive-complexity
      .then(async (token) => {
        // If token is not consumed yet, then consume it.
        if (token && token.status === 'pending' && !token.consumed) {
          try {
            // Create groups
            let groupIds = [];
            let groups = req.user.memberOf;

            if (groups && !Array.isArray(groups)) {
              groups = [groups];
            }

            for (let group of groups) {
              let result = await organizationController.group.add(
                req.params.org,
                group,
                false
              );
              groupIds.push(result._id);
            }

            let user = await userController.find(req.user.email);
            // If user doesn't exist, the create it.
            if (!user) {
              user = await userController.create(
                req.params.org,
                req.user.name ? req.user.name : req.user.email,
                req.user.email,
                null,
                false,
                groupIds,
                true
              );
            } else {
              // If user exists, then update user
              user = await userController.update(
                req.params.org,
                user._id,
                req.user.name,
                req.user.email,
                groupIds,
                true,
                true
              );
            }
            // Consume token with sucessfull status
            await organizationController.token.consume(
              req.params.org,
              token._id,
              'success',
              user._id
            );
          } catch (error) {
            console.log(error);
            // Consume token with error status
            await organizationController.token.consume(
              req.params.org,
              token._id,
              'error'
            );
            return res.send(
              'Authentication was sucessful but provisioning failed'
            );
          }
          /* 
            SSO Authentication is over.
            Display waiting page to user.
            GUI will be responsible for closing this window.
          */
          return res.render('spinner', { errorCode: 400 });
        } else {
          res.status(500).send('token not found....');
        }
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send('Tec error');
      });
  }
);

Router.get('/fail', (req, res) => {
  res.send('An error has happened while signing you in!');
});

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = Router;
