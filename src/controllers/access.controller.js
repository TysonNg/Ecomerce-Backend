"use strict";

const AsscessService = require("../services/access.service");
const {OK,CREATED,SuccessResponse} = require('../core/success.response')
console.log('accessController',AsscessService);

const HEADER = {
    REFRESHTOKEN: 'x-rtoken-id'
}
class AccessController {
    userLogout = async(req,res,next) =>{   
        res.clearCookie('refreshToken',{
            httpOnly: true,
            secure: false,
            sameSite: 'Strict'
        })    
        new SuccessResponse({
            message: 'Logout success!',
            metadata: await AsscessService.logout(req.keyStore)
        }).send(res)
    }

    userLogin = async(req,res,next) => {
       
        new SuccessResponse({
            metadata: await AsscessService.login(req.body,res)
        }).send(res)
       
    }
    userSignUp = async (req, res, next) => {
    new CREATED({
        message: 'User Created!',
        metadata: await AsscessService.signUp(req.body),
        options: {
            limit: 10
        }
    }).send(res)
  };

    refreshToken = async (req,res, next) => {
        new CREATED({
            message: 'new token created',
            metadata: await AsscessService.handleRefreshToken(req.body)
        }).send(res)
    }
}

module.exports = new AccessController();
