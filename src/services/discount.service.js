'use strict'

const { BadRequestError, NotFoundError } = require("../core/error.responese")
const discountModel = require("../models/discount.model")
const { product } = require("../models/product.model")
const { findAllDiscountCodeUnselect, checkDiscountExist, isProductOfDiscount } = require("../models/repositories/discount.repo")
const { findAllProducts } = require("../models/repositories/product.repo")
const { convertToObjectIdMongodb } = require("../utils")
const { getDiscountEligibility, isDiscountApplicableToProducts } = require("./discount-eligibility.service")

class DiscountServices{
    static selectAvailableDiscounts({ discounts, productIds, userId, now = new Date() }) {
        return discounts.filter((discount) => isDiscountApplicableToProducts({
            discount,
            productIds,
            userId,
            now,
        }))
    }

    static async getAvailableForShop({ shopId, productIds, userId, now = new Date() }) {
        const discounts = await discountModel.find({
            discount_shopId: convertToObjectIdMongodb(shopId),
            discount_is_active: true,
            $or: [
                { discount_applies_to: 'all' },
                { discount_applies_to: 'specific', discount_product_ids: { $in: productIds } },
            ],
        }).lean()

        return DiscountServices.selectAvailableDiscounts({
            discounts,
            productIds,
            userId,
            now,
        })
    }

    static previewDiscount({ discount, products, userId, now = new Date() }) {
        const preview = getDiscountEligibility({
            discount,
            shopProducts: products,
            userId,
            now,
        })

        return {
            totalOrder: preview.subtotal,
            discount: preview.discountAmount,
            totalPrice: preview.total,
        }
    }

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
    static async getAllDiscountCodeOfProduct({
        limit, page,productId,
        shopId
    }){
        console.log('shopId', productId);
        
        const discounts = await findAllDiscountCodeUnselect({
            limit: +limit,
            page: +page,
            filter:{
                discount_shopId: convertToObjectIdMongodb(shopId),
                discount_is_active: true,
                discount_product_ids: productId
            },
            unselect: ['__v'],
            model: discountModel
        })

        return discounts
    }

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
            model: discountModel
        })

        return discounts
    }

    static async getDiscountAmount({
        codeId, userId, shopId, products, isCheckout
    }){
        const foundDiscount = await checkDiscountExist({
            model: discountModel,
            filter:{
                discount_code: codeId,
                discount_shopId: convertToObjectIdMongodb(shopId)
            }
        })
        if(!foundDiscount) throw new NotFoundError(`Discount doesn't exist`)

        return DiscountServices.previewDiscount({
            discount: foundDiscount,
            products,
            userId,
        })
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
        if(!foundDiscount) throw new NotFoundError(`discount doesn't exist`)
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
