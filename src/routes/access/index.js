'use strict'

const express = require('express')
const accessController = require('../../controllers/access.controller')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const { authentication } = require('../../auth/checkAuth')

//signUp
router.post('/signUp',asyncHandler(accessController.userSignUp))

//login
router.post('/login', asyncHandler(accessController.userLogin))

//RefreshToken
router.post('/handleRefreshToken' ,asyncHandler(accessController.refreshToken))

//authentication
router.use(authentication)

//////////
router.post('/logout', asyncHandler(accessController.userLogout))

//


module.exports = router