"use strict";

const AsscessService = require("../services/access.service");
const {OK,CREATED,SuccessResponse} = require('../core/success.response')

class AccessController {
    handleRefreshToken = async(req,res,next) =>{
        new SuccessResponse({
            message: 'Get token success',
            metadata: await AsscessService.handleRefreshToken({
                refreshToken: req.refreshToken,
                user: req.user,
                keyStore: req.keyStore
            })
        }).send(res)
    }

    userLogout = async(req,res,next) =>{
        new SuccessResponse({
            message: 'Logout success!',
            metadata: await AsscessService.logout(req.keyStore)
        }).send(res)
    }

    userLogin = async(req,res,next) => {
        new SuccessResponse({
            metadata: await AsscessService.login(req.body)
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
}

module.exports = new AccessController();
