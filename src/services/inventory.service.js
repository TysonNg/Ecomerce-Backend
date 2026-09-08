'use strict'

const { BadRequestError } = require('../core/error.responese')
const {
    inventory
} = require('../models/inventory.model')
const { getProductById } = require('../models/repositories/cart_repo')
const { isOwnedByShop } = require('./seller-ownership.service')

class InventoryService{
    static async addStockToInventory({
        stock,
        productId,
        shopId,
        location = '181 Phu Nhuan HCM city'
    }){
        const product = await getProductById(productId)
        if(!product) throw new BadRequestError('Product does not exist!')
        if(!isOwnedByShop(product, shopId)) throw new BadRequestError('Product does not belong to this shop')
        
        const query = {inven_shopId: shopId, inven_productId: productId},
        updateSet={
            $inc: {
                inven_stock: stock
            },
            $set: {
                inven_location: location
            }
        }, options = {upsert: true, new: true}
        
        return await inventory.findOneAndUpdate(query,updateSet,options)
    }
}

module.exports = InventoryService
