"use strict";
const AsscessService = require("../services/access.service.js");
const JWT = require("jsonwebtoken");
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express()

app.use(cookieParser())




const createTokenPair = async (payload,privateKey) => {
  
  try {
    //access token
    const accessToken =  JWT.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: "20m",
    });
    
    const refreshToken =  JWT.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: "7 days",
    });
 
    return { accessToken, refreshToken };
  } catch (error) {
      console.error(error);
  }
};





const verifyJWT = async(token,keySecret)=>{
  return await JWT.verify(token,keySecret)
}



module.exports = {
  createTokenPair,
  verifyJWT
};
