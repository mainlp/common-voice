import { parse as parseURL } from 'url';
import { NextFunction, Request, Response } from 'express';
const PromiseRouter = require('express-promise-router');
import * as session from 'express-session';
const MySQLStore = require('express-mysql-session')(session);
import UserClient from './lib/model/user-client';
import DB from './lib/model/db';
import { getConfig } from './config-helper';
import Session from "supertokens-node/recipe/session";
import supertokens from "supertokens-node";

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
export default router;
const db = new DB();
export async function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
)
{
  let session = await Session.getSession(request, response,{ sessionRequired: false });
  if (session !== undefined) {
    let userId = session.getUserId();
    let userInfo = await supertokens.getUser(userId)
    request.user = {
      emails: userInfo.emails,
    };
  }
  if (request.user) {
    const accountClientId = await UserClient.findClientId(
      request.user.emails[0]
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
