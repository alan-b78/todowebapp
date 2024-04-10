const path = require('path');
const express = require('express');
const session = require('express-session');
const uuid = require('uuid');
const bodyParser = require('body-parser');
const lusca = require('lusca');
const helmet = require('helmet');

const routes = require('./routes');
const app = express();

app.disable('x-powered-by');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const middlewares = [
    express.static(path.join(__dirname, 'public')),
    bodyParser.json(),
    bodyParser.urlencoded({ extended: false }),
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://code.jquery.com", "https://maxcdn.bootstrapcdn.com"],
          styleSrc: ["'self'", "https://maxcdn.bootstrapcdn.com"],
          imgSrc: ["'self'"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "https://maxcdn.bootstrapcdn.com"],
          objectSrc: ["'none'"],
          frameAncestors: ["'self'"], // Specify allowed frame ancestors
          formAction: ["'self'"],
          upgradeInsecureRequests: [],
        }
      },
      // Set X-Content-Type-Options header to 'nosniff'
      nosniff: true
    }),
    (req, res, next) => {
      res.set('Content-Type', 'text/html');
      // You can remove the setting of X-Content-Type-Options here
      next();
    }
]

app.use(middlewares);

app.use(session({
  genid: (req) => {
     return uuid.v4();
  },
  secret: 'your-secret-key', 
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'strict' 
  }    
}));

app.use(lusca.csrf());
app.use('/', routes);

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});