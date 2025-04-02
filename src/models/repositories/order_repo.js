'use strict'

const { order } = require("../order.model")

const getOrdersId = async({order_userId}) => {
    console.log(order_userId);
    
    const orders = await order.find({order_userId}).lean()
    console.log(orders);
    
    return orders
}

module.exports = {
    getOrdersId
}