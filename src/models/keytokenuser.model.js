'use strict'

const {Schema, model} = require('mongoose')
const mongoose = require("mongoose");
const DOCUMENT_NAME = 'key'
const COLLECTION_NAME = 'keys'


var keyTokenUserSchema = new Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref:'User'
    },
    publicKey:{
        type: String, 
        required: true
    },
    privateKey:{
        type: String, 
        required: true
    },
    accessToken:{
        type:String,
        required: true
    },
    refreshToken:{
        type:String, 
        required:true
    },
    refreshTokenUsed:{
        type:Array,
        default:[]
    }
},{
    timestamps: true,
    collection: COLLECTION_NAME
});

//Export the model
module.exports = {
    keyTokenUserModel: model(DOCUMENT_NAME, keyTokenUserSchema)
}