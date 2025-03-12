'use strict'

const userModel = require("../models/user.model")

const findByEmail = async({email, select ={
    name: 1, password: 1, email: 1, roles:1
}})=>{
    return await userModel.findOne({email}).select(select).lean()
}

module.exports = {
    findByEmail
}