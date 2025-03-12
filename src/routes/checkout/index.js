'use strict'

const express = require('express')
const checkoutController = require('../../controllers/checkout.controller')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const { authentication } = require('../../auth/authUtils')


//get amount a discount
router.post('/review', asyncHandler(checkoutController.checkoutReview))


module.exports = router