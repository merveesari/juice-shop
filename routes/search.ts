/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import models = require('../models/index')
import { type Request, type Response, type NextFunction } from 'express'
import { UserModel } from '../models/user'

import * as utils from '../lib/utils'
const challengeUtils = require('../lib/challengeUtils')
const challenges = require('../data/datacache').challenges

class ErrorWithParent extends Error {
  parent: Error | undefined
}

// vuln-code-snippet start unionSqlInjectionChallenge dbSchemaChallenge
module.exports = function searchProducts () {
  return (req: Request, res: Response, next: NextFunction) => {
    const criteria: string = req.query.q || '';
    const sanitizedCriteria = criteria.substring(0, 200);

    models.sequelize.query('SELECT * FROM Products WHERE (name LIKE :criteria OR description LIKE :criteria) AND deletedAt IS NULL ORDER BY name', {
      replacements: { criteria: `%${sanitizedCriteria}%` },
      type: models.sequelize.QueryTypes.SELECT
    })
    .then((products: any) => {
      for (let i = 0; i < products.length; i++) {
        products[i].name = req.__(products[i].name);
        products[i].description = req.__(products[i].description);
      }
      res.json(utils.queryResultToJson(products));
    })
    .catch((error: ErrorWithParent) => {
      next(error.parent);
    });
  }
}
// vuln-code-snippet end unionSqlInjectionChallenge dbSchemaChallenge
