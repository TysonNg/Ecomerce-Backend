'use strict'
const mongoose = require('mongoose'); // Erase if already required
const DOCUMENT_NAME = "User"
const COLLECTION_NAME = 'Users'
// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    roles:{
        type: Array,
        default: []
    }
},{
    timestamps: true,
    collection: COLLECTION_NAME
});

//Export the model
module.exports = mongoose.model(DOCUMENT_NAME, userSchema);