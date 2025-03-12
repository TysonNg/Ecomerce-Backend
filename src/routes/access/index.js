'use strict'

const express = require('express')
const accessController = require('../../controllers/access.controller')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const { authentication, checkExistRefreshToken } = require('../../auth/authUtils')

//signUp
router.post('/signUp',asyncHandler(accessController.userSignUp))

//login
router.post('/login', asyncHandler(accessController.userLogin))

//authentication
router.use(authentication)

//////////
router.post('/logout', asyncHandler(accessController.userLogout))

//
router.post('/handleRefreshToken' , checkExistRefreshToken,asyncHandler(accessController.handleRefreshToken))


module.exports = router