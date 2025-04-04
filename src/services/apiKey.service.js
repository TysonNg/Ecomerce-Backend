'use strict'

const apiKeyModel = require("../models/apiKey.model")

const findById = async(key) => {
    // const newKey = await apiKeyModel.create({key: crypto.randomBytes(64).toString('hex'), permissions:['0000']})
    // console.log(newKey);
    
    const objKey = await apiKeyModel.findOne({key, status: true}).lean()
    console.log(key);
    
    console.log('objKey', objKey);
    
    return objKey
}

module.exports ={
    findById
}