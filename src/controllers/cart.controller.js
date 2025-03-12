"use strict";

const {OK,CREATED,SuccessResponse} = require('../core/success.response');
const CartService = require('../services/cart.service');

class CartController {

    addtoCart = async(req,res,next) => {
        new SuccessResponse({
            message: 'Successful Create Cart',
            metadata: await CartService.addToCart(req.body)
        }).send(res)
    }

    updateCart = async(req,res,next) => {
        new SuccessResponse({
            message: 'Successful Create Cart',
            metadata: await CartService.updateCart(req.body)

        }).send(res)
    }

    deleteItemOfUserCart = async(req,res,next) => {
        new SuccessResponse({
            message: 'Successful deleteCart',
            metadata: await CartService.deleteItemOfUserCart(req.body)
        }).send(res)
    }

    listTocart = async(req,res,next) => {
        new SuccessResponse({
            message: 'Successful lisTocart',
            metadata: await CartService.getListUserCart(req.query)

        }).send(res)
    }
}

module.exports = new CartController();
