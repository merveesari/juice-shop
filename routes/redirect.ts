/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { Request, Response, NextFunction } from 'express'
import challengeUtils from '../lib/challengeUtils'
import security from '../lib/insecurity'
import { isSafeURL } from '../lib/utils'
import { isURL } from 'validator'

module.exports = function performRedirect() {
  return (req: Request, res: Response, next: NextFunction) => {
    const toUrl = req.query.to

    if (isURL(toUrl) && isSafeURL(toUrl)) {
      challengeUtils.solveIf(challenges.redirectCryptoCurrencyChallenge, () => {
        return (
          toUrl ===
          'https://explorer.dash.org/address/Xr556RzuwX6hg5EGpkybbv5RanJoZN17kW' ||
          toUrl === 'https://blockchain.info/address/1AbKfgvw9psQ41NbLi8kufDQTezwG8DRZm' ||
          toUrl === 'https://etherscan.io/address/0x0f933ab9fcaaa782d0279c300d73750e1311eae6'
        )
      })
      res.redirect(toUrl)
    } else {
      res.status(406)
      next(new Error('Unrecognized or unsafe target URL for redirect'))
    }
  }
}
