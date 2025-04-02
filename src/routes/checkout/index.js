'use strict'

const express = require('express')
const checkoutController = require('../../controllers/checkout.controller')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const { authentication } = require('../../auth/checkAuth')


//get amount a discount
router.post('/review', asyncHandler(checkoutController.checkoutReview))


router.use(authentication)

router.post('/handleOrder', asyncHandler(checkoutController.handleOrder))

router.get('/getOrders', asyncHandler(checkoutController.getOrdersByUser))

module.exports = router