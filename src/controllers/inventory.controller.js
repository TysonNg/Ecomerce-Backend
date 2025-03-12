"use strict";

const {OK,CREATED,SuccessResponse} = require('../core/success.response');
const InventoryService = require('../services/inventory.service');

class InventoryController {

    addStockToInventory = async(req,res,next) => {
        new SuccessResponse({
            message: 'Successful addStockToInventory',
            metadata: await InventoryService.addToCart(req.body)
        }).send(res)
    }

}

module.exports = new InventoryController();
