'use strict'

const { BadRequestError, NotFoundError } = require("../core/error.responese")
const discountModel = require("../models/discount.model")
const { product } = require("../models/product.model")
const { findAllDiscountCodeUnselect, checkDiscountExist, isProductOfDiscount } = require("../models/repositories/discount.repo")
const { findAllProducts } = require("../models/repositories/product.repo")
const { convertToObjectIdMongodb } = require("../utils")

class DiscountServices{
    static async createDiscountCode(payload){
        const {
            code, start_date,end_date,is_active, shopId, min_order_value, product_ids, applies_to,name, description,
            type,value,max_value,max_uses, uses_count, max_uses_per_user, users_used
        } = payload
        
        if(new Date(start_date) >= new Date(end_date)){
            throw new BadRequestError('Start date must be before end_date !')
        }

        const foundDiscount = await discountModel.findOne({
            discount_code: code,
            discount_shopId: convertToObjectIdMongodb(shopId)    
        }).lean()

        if (foundDiscount && foundDiscount.discount_is_active){
            throw new BadRequestError('Discount existed!')
        }
        const newDiscount = await discountModel.create({
            discount_name: name,
            discount_description: description,
            discount_type: type,
            discount_value: value,
            discount_code: code, 
            discount_start_date: start_date,
            discount_end_date: end_date,
            discount_used_count: uses_count, 
            discount_user_used: users_used,
            discount_max_use: max_uses,
            discount_max_uses_per_user: max_uses_per_user, 
            discount_min_order_value:min_order_value || 0,
            discount_max_order_value: max_value,
            discount_shopId: shopId,
            discount_is_active:is_active,
            discount_applies_to: applies_to,
            discount_product_ids: applies_to == 'all'? [] : product_ids 
        })

        return newDiscount
    }

    static async updateDiscountCode(discount_code){
        
    }

    //get all discount codes available with products
    static async getAllDiscountCodeWithProducts({
        codeId, shopId, limit, page
    }){
        
        const foundDiscount = await discountModel.findOne({
            discount_code: codeId,
            discount_shopId: convertToObjectIdMongodb(shopId)    
        }).lean()

        if (!foundDiscount || !foundDiscount.discount_is_active) {
            throw new NotFoundError('Not found Discount')
        }

        const {discount_applies_to, discount_product_ids} = foundDiscount     
        if(discount_applies_to === 'all'){
            //get all Products
            const products =  await findAllProducts({
            filter: {
                product_shop: convertToObjectIdMongodb(shopId),
                isPublished: true
            },
            limit: +limit,
            page: +page,
            sort: 'ctime',
            select: ['product_name'] 
          })
            return products
        }
        if(discount_applies_to === "specific"){
            //get the products ids
            const products =  await findAllProducts({
                filter: {
                    _id: {$in: discount_product_ids},
                    isPublished: true
                },
                limit: +limit,
                page: +page,
                sort: 'ctime',
                select: ['product_name'] 
              })
            return products
        }

        
    }

    //get all discount code with shop
    static async getAllDiscountCodeByShop({
        limit, page,
        shopId
    }){
        const discounts = await findAllDiscountCodeUnselect({
            limit: +limit,
            page: +page,
            filter:{
                discount_shopId: convertToObjectIdMongodb(shopId),
                discount_is_active: true
            },
            unselect: ['__v', 'discount_shopId'],
            model: discount
        })

        return discounts
    }

    static async getDiscountAmount({
        codeId, userId, shopId, products
    }){        
        const foundDiscount = await checkDiscountExist({
            model: discountModel,
            filter:{
            discount_code: codeId,
            discount_shopId: convertToObjectIdMongodb(shopId)
            }
        })
        if(!foundDiscount) throw new NotFoundError(`Discount doesn't exist`)
        
        //Check product of discount matching product in cart?
        const checkIsProductOfDiscount = await isProductOfDiscount({
            discount_product_ids: foundDiscount.discount_product_ids,
            products
        })
        
        if(!checkIsProductOfDiscount) throw new BadRequestError(`Discount not for product`)
        
        const {discount_is_active, discount_max_use, discount_min_order_value,discount_user_used,discount_type,
            discount_value ,discount_max_uses_per_user} = foundDiscount
        if(!discount_is_active) throw new NotFoundError(`Discount expired`)
        if(!discount_max_use) throw new NotFoundError(`discount are out!`)


        //check discount min order value
        let totalOrder = 0
        if(discount_min_order_value > 0){
            //get total
            totalOrder = products.reduce((acc, product) =>{
                console.log(`quantity::${product.quantity}, price::${product.price}`);
                return acc + (product.quantity * product.price)
            }, 0)
        }        
        if(totalOrder < discount_min_order_value){
            throw new NotFoundError(`discount requires a minium order value of ${discount_min_order_value}`)
        }

        if(discount_max_uses_per_user > 0){
            const userUsedDiscount = discount_user_used.find(user => user.userId === userId)
            if(userUsedDiscount){
                throw new BadRequestError('user use max discount')
            }
        }

        //check discount is fixed_amout or percentage
        const amount = discount_type === 'fixed_amount'? discount_value: totalOrder * (discount_value / 100)

        return{
            totalOrder,
            discount: amount,
            totalPrice: totalOrder - amount
        }
    }

    static async deleteDiscount({shopId, codeId}){
        const deleted = await discountModel.findOneAndDelte({
            discount_code: codeId,
            discount_shop: convertToObjectIdMongodb(shopId)
        })
        return deleted
    }

    static async cancelDiscountCode({
        codeId, shopId,userId
    }){
        const foundDiscount = await checkDiscountExist({
            model: discountModel,
            filter:{
                discount_code: codeId,
                discount_shopId: convertToObjectIdMongodb(shopId)
            }
        })
        if(foundDiscount) throw new NotFoundError(`discount doesn't exist`)
        const result = await discountModel.findByIdAndUpdate(foundDiscount._id,{
            $pull:{
                discount_user_used: userId,
            },
            $inc:{
                discount_max_uses: 1,
                discount_uses_count: -1
            }
        })
        return result
    }
}

module.exports = DiscountServices