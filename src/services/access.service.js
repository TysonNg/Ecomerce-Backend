'use strict'
const express = require('express');
const app = express()
const userModel = require("../models/user.model.js")
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { createKeyToken } = require("./keytoken.service.js")
const { createTokenPair, verifyJWT } = require("../auth/authUtils")
const { BadRequestError, ConflictRequestError, AuthFailureError, ForbiddenError} = require("../core/error.responese")
const { getInfoData, isValidEmail } = require("../utils")
const { findByEmail } = require("./users.service.js")
const KeyTokenService = require("./keytoken.service.js")


const roleUser = {
    USER: 'USER',
    ADMIN: 'ADMIN'
}

class AsscessService {
    //LOGIN
    static login = async ({email, password},res) => {
        if(!isValidEmail(email)) throw new BadRequestError(`Error: Email not valid`)
        const foundUser = await findByEmail({email})
        
        if(!foundUser) throw new BadRequestError(`Error: User not registered`)
        console.log(`passWord ${password}, userPassWor ${foundUser.password}`);
        
        const match = await bcrypt.compare(password, foundUser.password);
        if(!match) throw new AuthFailureError('Authentication error')

            
        const {privateKey, publicKey} = crypto.generateKeyPairSync('rsa',{
            modulusLength: 2048,
            publicKeyEncoding:{
                type: 'spki',
                format: 'pem'
            },
                privateKeyEncoding:{
                type: 'pkcs8',
                format: 'pem',
                
            }
        })
        const {_id: userId} = foundUser
        const tokens = await createTokenPair({userId,email},privateKey)

        
        await KeyTokenService.createKeyToken({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            publicKey, userId,privateKey
        })
        
        return{
            user: getInfoData({fieleds:['_id','name','email'],object: foundUser}),
            tokens
        }  
    }



    //check this token used?
    static handleRefreshToken = async({refreshToken}) =>{
        const foundToken = await KeyTokenService.findByRefreshTokenUsed(refreshToken)

        if(foundToken) {
            const {userId, email} = await verifyJWT(refreshToken, foundToken.privateKey)
            await KeyTokenService.deleteKeyByUserId(userId)
            throw new ForbiddenError('Something wrong happend!! Pls relogin')

        }
        
        const holderToken = await KeyTokenService.findByRefreshToken(refreshToken)
        if(!holderToken) throw new AuthFailureError('User not registed')

        const {userId, email} = await verifyJWT(refreshToken, holderToken.privateKey)

        //check userId
        const foundUser = await findByEmail({email})
        if(!foundUser)  throw new AuthFailureError('user not registered')

        console.log('3');

        //create token pair
        const tokens = await createTokenPair({userId,email},holderToken.privateKey)
        //update keyStore        
        console.log('4');

        await holderToken.updateOne(
            {
                $set: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken
                },
                $addToSet:{
                    refreshTokenUsed: refreshToken
                }
            }
        )
        console.log('5');
        return{
            user: {userId, email},
            tokens
        }
    }

    
    //LOGOUT
    static logout = async (keyStore) => {  
        const delKey = await KeyTokenService.removeKeyById(keyStore._id)
        console.log({delKey});
        return delKey
    }

    //SIGN UP
    static signUp = async({name,email,password}) =>{
        try {
            if(!isValidEmail(email)) throw new BadRequestError(`Error: Email not valid`)
            const holderUser = await userModel.findOne({email}).lean();
            if(holderUser){
                
                throw new BadRequestError('Error: Shop already registered')
            }

            const passwordHash = await bcrypt.hash(password, 10)
            const newUser = await userModel.create({
                name,email,password: passwordHash, roles: [roleUser.USER]
            })

            if(newUser){
                //created privateKey, publicKey
                const {privateKey, publicKey} = crypto.generateKeyPairSync('rsa',{
                    modulusLength: 4096,
                    publicKeyEncoding:{
                        type: 'spki',
                        format: 'pem'
                    },
                    privateKeyEncoding:{
                        type: 'pkcs8',
                        format: 'pem',
                    }
                })

                const userId = newUser._id
                //create token pair
                const tokens = await createTokenPair({userId: newUser._id,email},privateKey)

                await KeyTokenService.createKeyToken({
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    publicKey, userId,privateKey
                })

                return{
                    code:201,
                    metadata:{
                        user: getInfoData({fieleds:['_id','email','name'],object: newUser}),
                        tokens
                    }
                }  
            }

            return{
                code:200,
                metadata: null
            }

        } catch (error) {
            console.log("loi");
            
           throw error
        }
    }
}
module.exports = AsscessService