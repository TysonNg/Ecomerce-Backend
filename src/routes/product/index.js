'use strict'

const express = require('express')
const productController = require('../../controllers/product.controller')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const { authentication } = require('../../auth/checkAuth')

//search
router.get('/search/:keySearch',asyncHandler(productController.getListSearchProduct))
router.get('',asyncHandler(productController.getAllProducts))
router.get('/viewsCount', asyncHandler(productController.getProductsByViewsCount))
router.get('/hotDeals', asyncHandler(productController.getHotDealProducts))
router.get('/categories', asyncHandler(productController.getAllProductsByCategory))
router.get('/:product_id', asyncHandler(productController.getProduct))


// //authentication
router.use(authentication)

router.post('',asyncHandler(productController.createProduct))

//update Product
router.patch('/update/:productId',asyncHandler(productController.updateProduct))

router.post('/publish/:id', asyncHandler(productController.publishProductByShop))
router.post('/unPublish/:id', asyncHandler(productController.unPublishProductByShop))

// QUERY //
router.get('/drafts/all', asyncHandler(productController.getAllDraftsForShop))
router.get('/published/all', asyncHandler(productController.getAllPublishForShop))


module.exports = router