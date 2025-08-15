import express from 'express';
import ViteExpress from 'vite-express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import session from 'express-session';
import bcrypt from 'bcrypt';
import FileStoreFactory from 'session-file-store';
import path from 'path';
import portfinder from 'portfinder';

import utils from '@transitive-sdk/utils';

import { COOKIE_NAME } from '@/common/constants.js';
import { createAccount, getAccount, login, requireLogin } from '@/server/auth.js';


const FileStore = FileStoreFactory(session);

dotenvExpand.expand(dotenv.config({path: './.env'}))

const log = utils.getLogger('main');
log.setLevel('debug');

const basePort = process.env.PORT || 3000;

const app = express();
app.use(express.json());
FileStore(session);

const fileStoreOptions = {
  path: path.join(process.env.TRANSACT_VAR_DIR + '/sessions'),
};

// Set up session middleware
app.use(session({
  store: new FileStore(fileStoreOptions),
  secret: process.env.TRANSACT_SESSION_SECRET, // used to sign the session ID cookie
  resave: false,
  saveUninitialized: true,
  cookie: {maxAge: 3 * 24 * 60 * 60 * 1000},
}));

// if username and password are provided as env vars, create account if it
// doesn't yet exists. This is used for initial bringup.
if (process.env.TRANSACT_USER && process.env.TRANSACT_PASS) {
  createAccount({
    name: process.env.TRANSACT_USER,
    password: process.env.TRANSACT_PASS,
    email: process.env.TRANSACT_EMAIL || '',
    admin: true
  });
}

// Example of a simple route
app.get('/hello', (_, res) => {
  res.send('Hello Vite + React + TypeScript!');
});

// Login with username and password
app.post('/api/login', async (req, res) => {
  log.debug('/api/login:', req.body.name);

  const fail = (error: string | Error) => {
    log.debug('login failed', req.body.name, error);
    res.clearCookie(COOKIE_NAME).status(401).json({error, ok: false});
  };

  if (!req.body.name || !req.body.password) {
    log.debug('missing credentials', req.body);
    return fail('no account name or password given');
    // on purpose not disclosing that the account doesn't exist
  }

  const account = await getAccount(req.body.name);
  if (!account) {
    log.info('no such account', req.body.name);
    return fail('invalid credentials');
    // on purpose not disclosing that the account doesn't exist
  }

  const valid = await bcrypt.compare(req.body.password, account.bcryptPassword);
  if (!valid) {
    log.info('wrong password for account', req.body.name);
    return fail('invalid credentials');
  }

  login(req, res, {account, redirect: '/dashboard/devices'});
});

// Logout the user
app.post('/api/logout', (req, res) => {
  if (req.session.user) {
    const wasUsername = req.session.user._id;
    req.session.destroy((err) => {
      if (err) {
        log.warn('Error destroying session:', err);
        res.status(500).json({ error: 'Could not destroy session' });
      } else {
        res.clearCookie(COOKIE_NAME, { httpOnly: false, secure: false });
        log.debug('logged out', { wasUsername });
        res.status(200).json({ status: 'ok' });
      }
    });
  } else {
    log.warn('logout of not-logged in user');
    res.status(403).json({ error: 'Not logged in' });
  }
});

// Register new user
app.post('/api/register', async (req, res) => {
  log.debug('Registration attempt:', { name: req.body.name, email: req.body.email });
  const { name, password, email } = req.body;
  
  if (!name || !password || !email) {
    log.warn('Registration failed: missing required fields');
    return res.status(400).json({ 
      error: 'Username, password, and email are required'
    });
  }
  
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Check if username already exists
    const existingAccount = await getAccount(name);
    if (existingAccount) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    
    // Create account (not admin by default, not verified by default)
    const newAccount = await createAccount({
      name,
      password,
      email,
      admin: false,
      verified: false
    });
    
    if (!newAccount) {
      return res.status(500).json({ error: 'Failed to create account' });
    }
    
    log.info(`Account created for ${name}`);
    res.status(201).json({ status: 'ok' });
  } catch (err) {
    log.error('Error creating account:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Refresh the session cookie
app.get('/api/refresh', async (req, res) => {
  const fail = (error) =>
    res.clearCookie(COOKIE_NAME).status(401).json({error, ok: false});

  if (!req.session.user) {
    log.info('no session user');
    return fail('no session');
  }
  const account = await getAccount(req.session.user._id);
  if (!account) {
    log.info('no account for user', req.session.user._id);
    return fail('invalid session');
  }

  login(req, res, {
    account,
    redirect: false
  });
});

// Get a JWT token for the current user
app.post('/api/getJWT', requireLogin, (req, res) => {
  console.log('getJWT', req.body, req.session.user._id);
  req.body.capability ||= 'ignore';

  if (req.body.capability.endsWith('_robot-agent')) {
    const msg =
      'We do not sign agent tokens. But capability tokens provide read-access.';
    log.warn(msg);
    return res.status(400).send(msg);
  }

  const token = jwt.sign({
      ...req.body,
      id: process.env.VITE_TRANSITIVE_USER, // Transitive portal user id
      userId: req.session.user._id,  // user name on dashboard
      validity: 86400,   // number of seconds
    }, process.env.JWT_SECRET);
  res.json({token});
});

app.use('/dashboard/', requireLogin);

const start = async () => {

  const port = await portfinder.getPortPromise({
    port: basePort,           // minimum port
    stopPort: basePort + 1000 // maximum port
  });

  ViteExpress.listen(app, port, () => {
    console.log(`Server is listening on port ${port}`);
    console.log(`Now open: http://localhost:${port}`);
  });
}

start();