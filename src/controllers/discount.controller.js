'use strict'

const { SuccessResponse } = require("../core/success.response");
const DiscountServices = require("../services/discount.service");

class DiscountController{

    createDiscountCode = async(req,res,next) =>{
        new SuccessResponse({
            message: 'Successful code generation',
            metadata: await DiscountServices.createDiscountCode({
                ...req.body,
                shopId: req.user.userId
            })
        }).send(res)
    }

    getAllDiscountCode = async(req,res,next) =>{
        new SuccessResponse({
            message: 'Successful Code Found',
            metadata: await DiscountServices.getAllDiscountCodeByShop({
                ...req.query,
                shopId: req.user.userId
            })
        }).send(res)
    }
    getDiscountAmount = async(req,res,next) =>{
        new SuccessResponse({
            message: 'Successful Code Found',
            metadata: await DiscountServices.getDiscountAmount({
                ...req.body
            })
        }).send(res)
    }
    getAllDiscountWithProducts = async(req,res,next) =>{
        new SuccessResponse({
            message: 'Successful Code Found',
            metadata: await DiscountServices.getAllDiscountCodeWithProducts({
                ...req.query
            })
        }).send(res)
    }
}

module.exports = new DiscountController();
