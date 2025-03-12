'use strict'

const { convertToObjectIdMongodb } = require("../../utils")
const inventoryModel = require("../inventory.model")
const {Types} = require('mongoose')

const insertInventory = async({
    productId, shopId, stock, location = 'unKnown'
}) => {

    return await inventoryModel.create({
        inven_productId: productId,
        inven_shopId: shopId,
        inven_stock: stock,
        inven_location: location
    })
}

const reservationInventory = async ({productId, quantity, cartId}) =>{
    const query = {
        inven_productId: convertToObjectIdMongodb(productId),
        inven_stock: {$gte: quantity}
    },updateSet = {
        $inc: {
            iven_stock : -quantity
        },
        $push: {
            iven_reservations: {
                quantity,
                cartId,
                createOn: new Date()
            }
        }
    }, options= {upsert: true, new: true}

    return await inventoryModel.updateOne(query,updateSet,options)
}

module.exports = {
    insertInventory,
    reservationInventory
}