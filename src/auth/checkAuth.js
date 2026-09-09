"use strict";
const express = require('express');
const JWT = require("jsonwebtoken");
const asyncHandler = require('express-async-handler')
const cookieParser = require('cookie-parser');
const { AuthFailureError, NotFoundError } = require('../core/error.responese');
const { findByUserId } = require('../services/keytoken.service.js');
const { isObjectIdOrHexString } = require('mongoose');
require('dotenv').config()

const app = express()
app.use(cookieParser())

const { findById } = require("../services/apiKey.service");

const HEADER = {
  API_KEY : 'x-api-key',
  CLIENT_ID: 'x-client-id',
  AUTHORIZATION: 'authorization',
  REFRESHTOKEN: 'x-rtoken-id'
}



const apiKey = async (req,res,next) => {
    try {
        const key = req.headers[HEADER.API_KEY]?.toString() || process.env.X_API_KEY;
        
        if(!key){
            return res.status(403).json({
                message: 'Forbidden Error'
            })
        }
        //check objKey
        const objKey = await findById(key)
        if(!objKey){
            return res.status(403).json({
                message: 'Forbidden Error'
            })
        }
        req.objKey = objKey
        
        return next()
    } catch (error) {
        next(error)
    }
};

const checkPermissions = (permissions) =>{
    return (req,res,next) =>{
        
        if(!req.objKey.permissions){
            return res.status(403).json({
                message: 'Permission denied'
            })
        }
        console.log('permissions::',req.objKey.permissions);
        const validPermission = req.objKey.permissions.includes(permissions)
        if(!validPermission){
            return res.status(403).json({
                message: 'Permission denied'
            })
        }
        
        return next()
        
    }
}


const authentication = asyncHandler(async(req,res,next)=>{
  //check userId missing?    
  const userId = req.headers[HEADER.CLIENT_ID]
  
  if (!isObjectIdOrHexString(userId)) throw new AuthFailureError('Invalid Request')
  
  //KeyStore
  const keyStore = await findByUserId(userId)
  
  if(!keyStore){
    throw new AuthFailureError('Session expired. Please sign in again')
  }
  const accessToken = req.headers[HEADER.AUTHORIZATION]

  if (!accessToken) throw new AuthFailureError('invalid request')
  
  try {
    const decodeUser = JWT.verify(accessToken,keyStore.publicKey)
      
    if(userId !== decodeUser.userId){
      throw new AuthFailureError('Auth error')
    }
    req.keyStore = keyStore
    req.user = decodeUser
    req.accessToken = req.headers[HEADER.AUTHORIZATION] 
    return next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthFailureError('ACCESS_TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError') {
      throw new AuthFailureError('Invalid access token');
    }
    throw error
  }
})


module.exports = {
    apiKey,
    checkPermissions,
    authentication
}
