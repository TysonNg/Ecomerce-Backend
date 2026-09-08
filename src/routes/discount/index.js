'use strict'

const express = require('express')
const discountController = require('../../controllers/discount.controller')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const { authentication } = require('../../auth/checkAuth')
const { requireRole, requireActiveShop } = require('../../auth/requireRole')


//get amount a discount
router.post('/amount', asyncHandler(discountController.getDiscountAmount))
router.post('/cancel', asyncHandler(discountController.cancelDiscount))
router.get('/list_product_code', asyncHandler(discountController.getAllDiscountWithProducts))
router.get('/available', authentication, asyncHandler(discountController.getAvailableDiscounts))


// //authentication
router.use(authentication)
router.use(requireRole('SHOP'), requireActiveShop)

router.post('', asyncHandler(discountController.createDiscountCode))
router.get('', asyncHandler(discountController.getAllDiscountCodeShop))
router.get('/codes', asyncHandler(discountController.getAllDiscountCodeOfProduct))


module.exports = router
