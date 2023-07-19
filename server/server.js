const fs = require('fs');
const cors = require('cors');
const https = require('https');
const helmet = require('helmet');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const RateLimit = require('express-rate-limit');
const isAuthenticated = require('./src/helper/authenticated.middleware');

// Express settings
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', './src/views');
app.set('view engine', 'pug');
app.use(helmet());
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  })
);
app.use(
  RateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30,
  })
);

// Session settings
app.use(
  session({
    name: 'vault',
    secret: process.env.SESSION_SECRET,
    secure: true,
    maxAge: 3600000 * 12,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 3600000 * 12,
    },
    store: MongoStore.create({
      mongoUrl: process.env.DATABASE_URL,
    }),
  })
);

// Routes
app.use('/assets', express.static('assets'));
app.use('/download', require('./src/routes/download.route'));
app.use('/setup', require('./src/routes/setup.route'));
app.use('/auth', require('./src/routes/auth.route'));
app.use(
  '/organization',
  isAuthenticated,
  require('./src/routes/organization.route')
);
app.use('/user', isAuthenticated, require('./src/routes/user.route'));
app.use('/profile', isAuthenticated, require('./src/routes/profile.route'));
app.use('/folder', isAuthenticated, require('./src/routes/folder.route'));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error_500');
});

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    const httpsServer = https.createServer(
      {
        key: fs.readFileSync('./key.pem'),
        cert: fs.readFileSync('./cert.pem'),
      },
      app
    );

    httpsServer.listen(process.env.PORT, () => {
      console.log(`HTTPS Server running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    if (error) {
      console.log(error);
      process.exit(-1);
    }
    console.error('Database connection error');
  });
