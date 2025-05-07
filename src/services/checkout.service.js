'use strict'

const { NotFoundError, BadRequestError } = require("../core/error.responese")
const { findCartById } = require("../models/repositories/cart_repo")
const { checkProductByServer } = require("../models/repositories/product.repo")
const { getDiscountAmount } = require("./discount.service")
const { accquireLock, releaseLock } = require("./redis.service")
const {order} = require('../models/order.model')
const { cart } = require("../models/cart.model")
const { getOrdersId } = require("../models/repositories/order_repo")
class CheckoutService{
    //check login and without login
    /*
        {
            cartId,
            userId,
            shop_order_ids: [
                {
                    shopId,
                    shop_discount: [],
                    item_products: [
                        {
                            price,
                            quantity,
                            productId
                        }
                    ] 
                }
            ]
        }
    */

    static async checkoutReview({cartId, userId, shop_order_ids = []}) {
        //check cartId

        const foundCart = await findCartById(cartId)
        
        if(!foundCart) throw new NotFoundError('Cart does not exist!')
        const checkout_order = {
            totalPrice: 0, // total price of order
            feeShip: 0, //fee 
            totalDiscount: 0, //total reduce by discount
            totalCheckout: 0 
        }, shop_order_ids_new = []
        
        
        for (let i = 0; i < shop_order_ids.length; i++) {
            const {shopId, shop_discount = [], item_products = []} = shop_order_ids[i]
            //check product available
            const checkProductServer = await checkProductByServer(item_products)
            // console.log(`checkProductServer:::${checkProductServer[{productId} = "67ce689ada9495f70ea32c6b"]}`);
            if (!checkProductServer[0]) throw new BadRequestError('Order Wrong!!!')
            
            const checkoutPrice = checkProductServer.reduce((acc, product) => {
                return acc + (product.quantity * product.price)
            },0)

            checkout_order.totalPrice += checkoutPrice

            const itemCheckout = {
                shopId, 
                shop_discount,
                priceRaw: checkoutPrice, // price before reduce by discount
                priceApplyDiscount: checkoutPrice,
                item_products: checkProductServer
            }
            //if shop_discount exist > 0 ,check valid
            if(shop_discount.length > 0) {
                const {totalPrice = 0,discount = 0} = await getDiscountAmount({
                    codeId: shop_discount[0].codeId,
                    userId,
                    shopId,
                    isCheckout: true,
                    products: checkProductServer
                })
                //total discount
                checkout_order.totalDiscount += discount
                
                if(discount > 0) {
                    itemCheckout.priceApplyDiscount = itemCheckout.priceRaw - discount
                }
            }
            //final checkout
            checkout_order.totalCheckout += itemCheckout.priceApplyDiscount
            shop_order_ids_new.push(itemCheckout)
        }

        return {
            shop_order_ids,
            shop_order_ids_new,
            checkout_order
        }
    }

    //order

    static async orderByUser({
        shop_order_ids,
        cartId,
        userId,
        user_address = {},
        user_payment = {}
    }){
        const {shop_order_ids_new, checkout_order} = await CheckoutService.checkoutReview({
            cartId,
            userId,
            shop_order_ids
        })
        
        // check once quantity's product of cart
        //get new array Products
        const products = shop_order_ids_new.flatMap(order => order.item_products)
        console.log(`[1]:`, products);
        const accquireProduct = []
        for (let i = 0; i < products.length; i++) {
            
            
            const {productId,quantity} = products[i]
            const keyLock = await accquireLock(productId, quantity, cartId)
            console.log('keylock', keyLock);
            
            accquireProduct.push(keyLock? true : false)
            if(keyLock){
                await releaseLock(keyLock)
            }
        }
        
        //check if 1 product outstock in inventory
        if (accquireProduct.includes(false)) {
            throw new BadRequestError('Few product be updated. Pls check again cart')
        }

        const newOrder = await order.create({
            order_userId: userId,
            order_checkout: checkout_order,
            order_shipping: user_address,
            order_payment: user_payment,
            order_products: products,
            order_trackingNumber: `#0000${Date.now()}2025`
        })

        //Case: if insert successfully => remove product of cart
        if(newOrder){
            //remove product in my cart
            await cart.findOneAndUpdate({cart_userId: cartId, cart_state: 'active'}, {$set: {cart_products: []}}, {new: true, upsert: true})
           
        }
        return newOrder
        
    }

    //Querry Order
    static async getOrdersByUser({order_userId}) {
        if(!order_userId){
            throw new BadRequestError('Pls relogin!')
        }
        return await getOrdersId({order_userId})
    }

    //Query Order Using Id [Users]
    static async getOneOderByUser() {
        
    }

    //Cancel Order [ Users]
    static async cancelOderByUser() {
        
    }

    //Update Oder Status [Shop | Admin]
    static async updateOrderStatusByShop() {
        
    }

}

module.exports = CheckoutService