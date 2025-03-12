'use strict'

const express = require('express')
const { apiKey,checkPermissions } = require('../auth/checkAuth')
const router = express.Router()
const rootUrl = '/v1/api'
// check apiKey
router.use(apiKey)

//check permission
router.use(checkPermissions('0000'))

//access
router.use(`${rootUrl}/user`, require('./access'))

//product
router.use(`${rootUrl}/product`,require('./product'))

//discount
router.use(`${rootUrl}/discount`, require('./discount'))

//cart
router.use(`${rootUrl}/cart`, require('./cart'))

//checkout
router.use(`${rootUrl}/checkout`, require('./checkout'))

//inventory
router.use(`${rootUrl}/checkout`, require('./inventory'))

module.exports = router