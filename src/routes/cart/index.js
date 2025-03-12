'use strict'

const express = require('express')
const cartController = require('../../controllers/cart.controller')
const router = express.Router()
const asyncHandler = require('express-async-handler')




router.post('', asyncHandler(cartController.addtoCart))
router.delete('', asyncHandler(cartController.deleteItemOfUserCart))
router.post('/update', asyncHandler(cartController.updateCart))
router.get('', asyncHandler(cartController.listTocart))



module.exports = router