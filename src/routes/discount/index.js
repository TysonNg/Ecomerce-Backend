'use strict'

const express = require('express')
const discountController = require('../../controllers/discount.controller')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const { authentication } = require('../../auth/checkAuth')


//get amount a discount
router.post('/amount', asyncHandler(discountController.getDiscountAmount))
router.post('/cancel', asyncHandler(discountController.cancelDiscount))
router.get('/list_product_code', asyncHandler(discountController.getAllDiscountWithProducts))


// //authentication
router.use(authentication)

router.post('', asyncHandler(discountController.createDiscountCode))
router.get('', asyncHandler(discountController.getAllDiscountCodeShop))
router.get('/codes', asyncHandler(discountController.getAllDiscountCodeOfProduct))


module.exports = router