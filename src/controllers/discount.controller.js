'use strict'

const { SuccessResponse } = require("../core/success.response");
const DiscountServices = require("../services/discount.service");

class DiscountController{
    getAvailableDiscounts = async(req,res,next) =>{
        const productIds = `${req.query.productIds ?? ''}`
            .split(',')
            .map((productId) => productId.trim())
            .filter(Boolean)

        new SuccessResponse({
            message: 'Available discount codes found',
            metadata: await DiscountServices.getAvailableForShop({
                shopId: req.query.shopId,
                productIds,
                userId: req.user.userId,
            })
        }).send(res)
    }


    createDiscountCode = async(req,res,next) =>{
        new SuccessResponse({
            message: 'Successful code generation',
            metadata: await DiscountServices.createDiscountCode({
                ...req.body,
                shopId: req.shop._id
            })
        }).send(res)
    }

    getAllDiscountCodeShop = async(req,res,next) =>{
        new SuccessResponse({
            message: 'Successful Code Found',
            metadata: await DiscountServices.getAllDiscountCodeByShop({
                ...req.query,
                shopId: req.shop._id
            })
        }).send(res)
    }
    getAllDiscountCodeOfProduct = async(req,res,next) =>{
        new SuccessResponse({
            message: 'Successful Code Found',
            metadata: await DiscountServices.getAllDiscountCodeOfProduct({
                ...req.query,
                shopId: req.shop._id
            })
        }).send(res)
    }

    getDiscountAmount = async(req,res,next) =>{
        new SuccessResponse({
            message: 'Successful Code Found',
            metadata: await DiscountServices.getDiscountAmount({
                ...req.body,
                isCheckout: false
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

    cancelDiscount = async(req,res,next) => {
        new SuccessResponse({
            message: 'Successful cancel discount!',
            metadata: await DiscountServices.cancelDiscountCode({
                ...req.body
            })
        }).send(res)
    }
}

module.exports = new DiscountController();
