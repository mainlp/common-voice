import { parse as parseURL } from 'url';
import * as passport from 'passport';
import { NextFunction, Request, Response } from 'express';
const PromiseRouter = require('express-promise-router');
import * as session from 'express-session';
const MySQLStore = require('express-mysql-session')(session);
import UserClient from './lib/model/user-client';
import DB from './lib/model/db';
import { getConfig } from './config-helper';
const {
  MYSQLHOST,
  MYSQLDBNAME,
  MYSQLUSER,
  MYSQLPASS,
  PROD,
  SECRET,
} = getConfig();
const router = PromiseRouter();
router.use(require('cookie-parser')());
router.use(
  session({
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: PROD,
    },
    secret: SECRET,
    store: new MySQLStore({
      host: MYSQLHOST,
      user: MYSQLUSER,
      password: MYSQLPASS,
      database: MYSQLDBNAME,
      createDatabaseTable: false,
    }),
    proxy: true,
    resave: false,
    saveUninitialized: false,
  })
);
router.use(passport.initialize());
router.use(passport.session());
passport.serializeUser((user: any, done: Function) => done(null, user));
passport.deserializeUser((sessionUser: any, done: Function) =>
  done(null, sessionUser)
);
export default router;
const db = new DB();
export async function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
) {
  if (request.user) {
    const accountClientId = await UserClient.findClientId(
      request.user.emails[0].value
    );
    if (accountClientId) {
      request.client_id = accountClientId;
      next();
      return;
    }
  }
  const [authType, credentials] = (request.header('Authorization') || '').split(
    ' '
  );
  if (authType === 'Basic') {
    const [client_id, auth_token] = Buffer.from(credentials, 'base64')
      .toString()
      .split(':');
    if (await UserClient.hasSSO(client_id)) {
      response.sendStatus(401);
      return;
    } else {
      const verified = await db.createOrVerifyUserClient(client_id, auth_token);
      if (!verified) {
        response.sendStatus(401);
        return;
      }
    }
    request.client_id = client_id;
  }
  next();
}
