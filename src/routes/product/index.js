'use strict'

const express = require('express')
const productController = require('../../controllers/product.controller')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const { authentication } = require('../../auth/checkAuth')
const { requireRole, requireActiveShop } = require('../../auth/requireRole')

//search
router.get('/search/:keySearch',asyncHandler(productController.getListSearchProduct))
router.get('',asyncHandler(productController.getAllProducts))
router.get('/viewsCount', asyncHandler(productController.getProductsByViewsCount))
router.get('/hotDeals', asyncHandler(productController.getHotDealProducts))
router.get('/categories', asyncHandler(productController.getAllProductsByCategory))
router.get('/shop/:idOrSlug', asyncHandler(productController.getProductsByShop))
router.get('/:product_id([0-9a-fA-F]{24})', asyncHandler(productController.getProduct))


// //authentication
router.use(authentication)
router.use(requireRole('SHOP'), requireActiveShop)

router.post('',asyncHandler(productController.createProduct))

//update Product
router.patch('/update/:productId',asyncHandler(productController.updateProduct))

router.post('/publish/:id', asyncHandler(productController.publishProductByShop))
router.post('/unPublish/:id', asyncHandler(productController.unPublishProductByShop))

// QUERY //
router.get('/drafts/all', asyncHandler(productController.getAllDraftsForShop))
router.get('/published/all', asyncHandler(productController.getAllPublishForShop))


module.exports = router
