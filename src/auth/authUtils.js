"use strict";
const asyncHandler = require('express-async-handler')
const JWT = require("jsonwebtoken");
const { AuthFailureError, NotFoundError, ForbiddenError } = require('../core/error.responese');
const { findByUserId } = require('../services/keytoken.service');
const HEADER = {
  API_KEY : 'x-api-key',
  CLIENT_ID: 'x-client-id',
  AUTHORIZATION: 'authorization',
  REFRESHTOKEN: 'x-rtoken-id'
}



const createTokenPair = async (payload,privateKey) => {
  try {
    //access token
    
    const accessToken = await JWT.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: "2 days",
    });
    
    
    const refreshToken = await JWT.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: "7 days",
    });
    console.log(`acceesstoken::${accessToken}, refreshToken::${refreshToken}`);
    return { accessToken, refreshToken };
  } catch (error) {
      console.error(error);
  }
};


const authentication = asyncHandler(async(req,res,next)=>{
  //check userId missing?  
  const userId = req.headers[HEADER.CLIENT_ID]

  
  if (!userId) throw new AuthFailureError('Invalid Request')
    console.log(`userId:: ${userId}`);
  
  //KeyStore
  const keyStore = await findByUserId(userId)
  console.log(`keystore:: ${keyStore}`);
  
  if(!keyStore){
    throw new NotFoundError('Not Found KeyStore')
  }

  if(req.headers[HEADER.REFRESHTOKEN]){
    try {
      const refreshToken = req.headers[HEADER.REFRESHTOKEN]
      const decodeUser = JWT.verify(refreshToken,keyStore.publicKey)
      if(userId !== decodeUser.userId){
        throw new AuthFailureError('Invalid userId')
      }
      req.keyStore = keyStore
      req.user = decodeUser
      req.refreshToken = refreshToken
      return next()
    } catch (error) {
    }
  }

  if(req.headers[HEADER.AUTHORIZATION]){
    try {
      const accessToken = req.headers[HEADER.AUTHORIZATION] 
      const decodeUser = JWT.verify(accessToken,keyStore.publicKey)
      console.log(`decodeUserID::${decodeUser.userId}`);
      
      if(userId !== decodeUser.userId){
        throw new AuthFailureError('Auth error')
      }
      req.keyStore = keyStore
      req.user = decodeUser
      req.accessToken = req.headers[HEADER.AUTHORIZATION]
      return next()
    } catch (error) {
      throw error
    }
  }else{
    return null
  }
})



const verifyJWT = async(token,keySecret)=>{
  return await JWT.verify(token,keySecret)
}

const checkExistRefreshToken = async(req,res,next)=>{
  if(req.headers[HEADER.REFRESHTOKEN]){
    next()
  }else{
    throw new NotFoundError('RefreshToken Not found!!!')
  }
}

module.exports = {
  createTokenPair,
  authentication,
  verifyJWT,
  checkExistRefreshToken
};
