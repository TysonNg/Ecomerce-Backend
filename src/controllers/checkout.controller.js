"use strict";

const {OK,CREATED,SuccessResponse} = require('../core/success.response');
const CheckoutService = require('../services/checkout.service');

class checkoutController {

    checkoutReview = async (req,res,next) => {
        new SuccessResponse({
            message: 'Successfull checkoutReview!',
            metadata: await CheckoutService.checkoutReview(req.body)
        }).send(res)
    }
}

module.exports = new checkoutController();
