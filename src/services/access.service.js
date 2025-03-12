'use strict'

const userModel = require("../models/user.model")
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { createKeyToken } = require("./keytoken.service")
const { createTokenPair, verifyJWT } = require("../auth/authUtils")
const { BadRequestError, ConflictRequestError, AuthFailureError, ForbiddenError} = require("../core/error.responese")
const { getInfoData } = require("../utils")
const { findByEmail } = require("./users.service")
const KeyTokenService = require("./keytoken.service")
const keytokenuserModel = require("../models/keytokenuser.model")


const roleUser = {
    USER: 'USER',
    ADMIN: 'ADMIN'
}

class AsscessService {
    //LOGIN
    static login = async ({email, password}) => {
        const foundUser = await findByEmail({email})
        if(!foundUser) throw new BadRequestError('Error: User not registered')

        const match = bcrypt.compare(password, foundUser.password);
        if(!match) throw new AuthFailureError('Authentication error')

            
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
        
        const {_id: userId} = foundUser
        const tokens = await createTokenPair({userId,email},privateKey)
        console.log('refreshToken', tokens.refreshToken);
        
        await KeyTokenService.createKeyToken({
            refreshToken: tokens.refreshToken,
            publicKey, userId
        })
        
        return{
            user: getInfoData({fieleds:['_id','name','email'],object: foundUser}),
            tokens
        }  
    }



    //check this token used?
    static handleRefreshToken = async({refreshToken,user,keyStore}) =>{
        const {userId,email} = user;
        if(keyStore.refreshTokenUsed.includes(refreshToken)){
            await KeyTokenService.deleteKeyByUserId(userId)
            throw new ForbiddenError('Something wrong happend!! Pls relogin')
        }

        if(keyStore.refreshToken !== refreshToken){
            throw new AuthFailureError('user not registered')
        }

        //check userId
        const foundUser = await findByEmail({email})
        if(!foundUser)  throw new AuthFailureError('user not registered')

        //create token pair
        const tokens = await createTokenPair({userId: foundUser._id,email},keyStore.publicKey,keyStore.privateKey)
        
        //update token        
        await keytokenuserModel.updateOne(
            {
                $set: {
                    refreshToken: tokens.refreshToken
                },
                $addToSet:{
                    refreshTokenUsed: refreshToken
                }
            }
        )
        return{
            user,
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

                console.log({privateKey,publicKey}); //save collection KeyStore
                const keyStore = await createKeyToken({
                    userId: newUser._id,
                    publicKey
                })
                
                if(!keyStore){
                    throw new BadRequestError('Error::keyStore error')
                }
                //create token pair
                const tokens = await createTokenPair({userId: newUser._id,email},keyStore,privateKey)

                return{
                    code:201,
                    metadata:{
                        user: getInfoData({fieleds:['_id','email'],object: newUser}),
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