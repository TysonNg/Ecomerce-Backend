'use strict'

const express = require('express')
const inventoryController = require('../../controllers/inventory.controller')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const { authentication } = require('../../auth/checkAuth')
const { requireRole, requireActiveShop } = require('../../auth/requireRole')



//authentication
router.use(authentication)
router.use(requireRole('SHOP'), requireActiveShop)


router.post('', asyncHandler(inventoryController.addStockToInventory))


module.exports = router
