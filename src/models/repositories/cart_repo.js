'use strict'

const { convertToObjectIdMongodb } = require("../../utils")
const { cart } = require("../cart.model")
const { product } = require("../product.model")



const findCartById = async(cartId) =>{
    return await cart.findOne({_id: convertToObjectIdMongodb(cartId), cart_state: 'active'}).lean()
}

const createUserCart = async({userId, product}) => {
    const query = {cart_userId: userId, cart_state: 'active'},
    updateOrInsert = {
        $push:{
            cart_products: product
        }
    }, options = {upsert: true, new: true}

    return await cart.findOneAndUpdate(query,updateOrInsert,options)
}

const updateUserCartQuantity = async({userId, product}) => {
    const {productId, quantity} = product
    console.log('productId', productId);
    console.log(userId);
    
    const query = {
        cart_userId: userId,
        'cart_products.productId': productId,
        cart_state: 'active'
    }, updateSet={
        $inc: {
            'cart_products.$.quantity': quantity,
        }
    },options = {upsert: true, new: true}

    return await cart.findOneAndUpdate(query,updateSet,options)
}


const getProductById = async(productId) => {
    
    return await product.findOne({_id: convertToObjectIdMongodb(productId)}).lean()
}
module.exports = {
    createUserCart,
    updateUserCartQuantity,
    getProductById,
    findCartById
}