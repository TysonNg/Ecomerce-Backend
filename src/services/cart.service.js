'use strict'

const { NotFoundError } = require("../core/error.responese")
const { cart } = require("../models/cart.model")
const { createUserCart, updateUserCartQuantity, getProductById } = require("../models/repositories/cart_repo")
const { convertToObjectIdMongodb } = require("../utils")

/*
    Key features: Cart Service
    - add product to cart
    - reduce product quantity by one
    = increase product quantity by One
    - get cart
    - delete cart
    -delete cart item
*/

class CartService {


    static async addToCart({
        userId, product = {}
    }){
        //check cart exist?
        const {productId, quantity} = product
        const userCart = await cart.findOne({cart_userId: userId})
        if (!userCart){
            //create cart for User

            return await createUserCart({userId,product})
        }

        //if have cart but don't have product?
        if(!userCart.cart_products.length){
            userCart.cart_products = [product]
            return await userCart.save()
        }

        const existItemOfCart = await cart.findOne({cart_userId: userId, 'cart_products.productId': productId})
        if(!existItemOfCart){
            userCart.cart_products.push(product)
            return await userCart.save()
        }

        // if cart exist and have product => update quantity
        return await updateUserCartQuantity({userId, product: {productId,quantity: 1 }})
    }

    //update cart
    /*
        {
            userId,
            shop_order_ids: [
                    {
                        shopId,
                        item_products:[
                            {
                                quantity,
                                price
                                shopId,
                                old_quantity,
                                productId
                            }
                        ],
                        version
                    }
                ]
        }
        
    */
    static async updateCart({userId, shop_order_ids = []}){
        console.log(shop_order_ids[0]?.item_products[0]);
        
        const {productId, quantity, old_quantity} = shop_order_ids[0]?.item_products[0]
        //check product exist?        
        const foundProduct = await getProductById(productId)
        
        if(!foundProduct) throw new NotFoundError('Product not exist!')
        //compare
        if(foundProduct.product_shop.toString() !== shop_order_ids[0]?.shopId){
            throw new NotFoundError('Product do not belong to the shop')
        }
        if(quantity === 0){
            //deleted product of cart
            return await CartService.deleteItemOfUserCart({userId,productId})
        }
            
        return await updateUserCartQuantity({userId, 
            product:{
                productId,
                quantity: quantity - old_quantity
            }})
    }


    static async deleteItemOfUserCart({userId, productId}){
        const query = {cart_userId: userId, cart_state : 'active'},
        updateSet = {
            $pull:{
                cart_products:{
                    productId
                }
            }
        }
        const deleteCart = await cart.updateOne(query, updateSet)
        return deleteCart
    }

    static async getListUserCart({userId}){
        return await cart.findOne({
            cart_userId: userId
        }).lean()
    }
}



module.exports = CartService