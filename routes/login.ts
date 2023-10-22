/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import models = require('../models/index')
import { type Request, type Response, type NextFunction } from 'express'
import { type User } from '../data/types'
import { BasketModel } from '../models/basket'
import { UserModel } from '../models/user'
import challengeUtils = require('../lib/challengeUtils')
import config from 'config'

import * as utils from '../lib/utils'
const security = require('../lib/insecurity')
const challenges = require('../data/datacache').challenges
const users = require('../data/datacache').users

// vuln-code-snippet start loginAdminChallenge loginBenderChallenge loginJimChallenge
const { check, validationResult } = require('express-validator');

module.exports = function login() {
  function afterLogin(user, res, next) {
    verifyPostLoginChallenges(user);

    BasketModel.findOrCreate({ where: { UserId: user.data.id } })
      .then(([basket]) => {
        const token = security.authorize(user);
        user.bid = basket.id; // Keep track of the original basket
        security.authenticatedUsers.put(token, user);
        res.json({ authentication: { token, bid: basket.id, umail: user.data.email } });
      })
      .catch((error) => {
        next(error);
      });
  }

  return [
    // Middleware to validate and sanitize input
    check('email').isEmail().normalizeEmail(),
    check('password').isString().trim(),

    (req, res, next) => {
      verifyPreLoginChallenges(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const email = req.body.email || '';
      const password = security.hash(req.body.password || '');

      models.sequelize
        .query('SELECT * FROM Users WHERE email = :email AND password = :password AND deletedAt IS NULL', {
          replacements: { email, password },
          model: UserModel,
          plain: true,
        })
        .then((authenticatedUser) => {
          const user = utils.queryResultToJson(authenticatedUser);

          if (user.data?.id && user.data.totpSecret !== '') {
            res.status(401).json({
              status: 'totp_token_required',
              data: {
                tmpToken: security.authorize({
                  userId: user.data.id,
                  type: 'password_valid_needs_second_factor_token',
                }),
              },
            });
          } else if (user.data?.id) {
            afterLogin(user, res, next);
          } else {
            res.status(401).send('Invalid email or password.');
          }
        })
        .catch((error) => {
          next(error);
        });
    },
  ];
};
  // vuln-code-snippet end loginAdminChallenge loginBenderChallenge loginJimChallenge

  function verifyPreLoginChallenges (req: Request) {
    challengeUtils.solveIf(challenges.weakPasswordChallenge, () => { return req.body.email === 'admin@' + config.get('application.domain') && req.body.password === 'admin123' })
    challengeUtils.solveIf(challenges.loginSupportChallenge, () => { return req.body.email === 'support@' + config.get('application.domain') && req.body.password === 'J6aVjTgOpRs@?5l!Zkq2AYnCE@RF$P' })
    challengeUtils.solveIf(challenges.loginRapperChallenge, () => { return req.body.email === 'mc.safesearch@' + config.get('application.domain') && req.body.password === 'Mr. N00dles' })
    challengeUtils.solveIf(challenges.loginAmyChallenge, () => { return req.body.email === 'amy@' + config.get('application.domain') && req.body.password === 'K1f.....................' })
    challengeUtils.solveIf(challenges.dlpPasswordSprayingChallenge, () => { return req.body.email === 'J12934@' + config.get('application.domain') && req.body.password === '0Y8rMnww$*9VFYE§59-!Fg1L6t&6lB' })
    challengeUtils.solveIf(challenges.oauthUserPasswordChallenge, () => { return req.body.email === 'bjoern.kimminich@gmail.com' && req.body.password === 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI=' })
  }

  function verifyPostLoginChallenges (user: { data: User }) {
    challengeUtils.solveIf(challenges.loginAdminChallenge, () => { return user.data.id === users.admin.id })
    challengeUtils.solveIf(challenges.loginJimChallenge, () => { return user.data.id === users.jim.id })
    challengeUtils.solveIf(challenges.loginBenderChallenge, () => { return user.data.id === users.bender.id })
    challengeUtils.solveIf(challenges.ghostLoginChallenge, () => { return user.data.id === users.chris.id })
    if (challengeUtils.notSolved(challenges.ephemeralAccountantChallenge) && user.data.email === 'acc0unt4nt@' + config.get('application.domain') && user.data.role === 'accounting') {
      UserModel.count({ where: { email: 'acc0unt4nt@' + config.get('application.domain') } }).then((count: number) => {
        if (count === 0) {
          challengeUtils.solve(challenges.ephemeralAccountantChallenge)
        }
      }).catch(() => {
        throw new Error('Unable to verify challenges! Try again')
      })
    }
  }
}
