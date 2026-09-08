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

//shop registration and approval
router.use(`${rootUrl}/shop`, require('./shop'))
router.use(`${rootUrl}/admin`, require('./admin'))

//product
router.use(`${rootUrl}/product`,require('./product'))

//discount
router.use(`${rootUrl}/discount`, require('./discount'))

//cart
router.use(`${rootUrl}/cart`, require('./cart'))

//checkout
router.use(`${rootUrl}/checkout`, require('./checkout'))

//inventory
router.use(`${rootUrl}/inventory`, require('./inventory'))

//review
router.use(`${rootUrl}/reviews`, require('./review'))

module.exports = router
