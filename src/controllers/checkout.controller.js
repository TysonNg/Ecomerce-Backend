"use strict";

const {SuccessResponse} = require('../core/success.response');
const CheckoutService = require('../services/checkout.service');

class checkoutController {

    checkoutReview = async (req,res,next) => {
        new SuccessResponse({
            message: 'Successfull checkoutReview!',
            metadata: await CheckoutService.checkoutReview(req.body)
        }).send(res)
    }

    handleOrder = async(req,res,next) => {
        new SuccessResponse({
            message: 'Successfull handleOrder!',
            metadata: await CheckoutService.orderByUser(req.body)
        }).send(res)
    }

    getOrdersByUser = async(req,res,next) => {
        new SuccessResponse({
            message: 'Successfull getOrdersByUser',
            metadata: await CheckoutService.getOrdersByUser({
                order_userId: req.user.userId
            })
        }).send(res)
    }
}

module.exports = new checkoutController();
