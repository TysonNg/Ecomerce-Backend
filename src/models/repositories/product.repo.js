'use strict'

const { Types } = require('mongoose')
const {product,electronics,clothing,jewelry} = require('../../models/product.model')
const {getSelectData, unGetSelectData} = require('../../utils/index')
const { getProductById } = require('./cart_repo')
const { BadRequestError } = require('../../core/error.responese')

//QUERY
const findAllDraftsForShop = async({query,limit,skip}) =>{
    return await queryProduct({query,limit,skip})
}

const findAllPublishForShop = async({query,limit,skip}) =>{
    return await queryProduct({query,limit,skip})
}

const findAllProducts = async({limit,sort,filter,page,select}) =>{
    const skip = (page - 1) * limit;
    const sortBy = sort === 'ctime' ? {_id: -1} : {_id: 1}
    const products = await product.find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select(getSelectData(select))
    .lean()
    return products
}

const findProductsByCategory = async({limit,sort,category,page,select}) =>{
    const skip = (page - 1) * limit;
    const sortBy = sort === 'ctime' ? {_id: -1} : {_id: 1}
    const products = await product.find({
        isPublished: true,
        product_type: category
    })
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select(getSelectData(select))
    .lean()

    return products
}

//FIND PRODUCT
const findProduct = async({product_id, unSelect})=>{
    return await product.findByIdAndUpdate(product_id,{$inc: {product_viewsCount: 1}},{upsert: true,new: true}).select(unGetSelectData(unSelect))
}

//UPDATE PRODUCT
const updateProductById = async({productId, objectParams, model, isNew = true}) =>{
    return await model.findByIdAndUpdate( productId, {$set: objectParams} ,
        {new: isNew}
    )
}


const queryProduct =  async ({query,limit,skip})=>{
    return await product.find(query)
    .populate('product_shop','name email -_id')
    .sort({updateAt: -1})
    .skip(skip)
    .limit(limit)
    .lean()
    .exec()
}
//END QUERY

const publishProductByShop = async({product_shop,product_id}) =>{
    const foundShop = product.findOne({
        product_shop: new Types.ObjectId(`${product_shop}`),
        _id: new Types.ObjectId(`${product_id}`)
    })
    console.log(`foundShop::${foundShop}`);
    if (!foundShop) return null
    const {modifiedCount} = await foundShop.updateOne({$set:{isDraft: false, isPublished: true}}) //if modify, modifiedCount will return 1; else return 0
    
    return modifiedCount
}

const unPublishProductByShop = async({product_shop,product_id}) =>{
    const foundShop = product.findOne({
        product_shop: new Types.ObjectId(`${product_shop}`),
        _id: new Types.ObjectId(`${product_id}`)
    })
    console.log(`foundShop::${foundShop}`);
    if (!foundShop) return null
    const {modifiedCount} = await foundShop.updateOne({$set:{isDraft: true, isPublished: false}}) //if modify, modifiedCount will return 1; else return 0
    
    return modifiedCount
}

//fullText search in mongoDb
const searchProductByUser = async({keySearch})=>{
    const regexSearch = new RegExp(keySearch)
    const results = await product.find({
        isPublished: true,
        $text:{$search: regexSearch}},
        {score:{$meta:'textScore'}})
    .sort({score:{$meta:'textScore'}})
    .lean()

    return results
}
 

const checkProductByServer = async(products) => {
    return await Promise.all(products.map(async product => {
        const foundProduct = await getProductById(product.productId)
        
        if(foundProduct){
            return{
                price: foundProduct.product_price,
                quantity: product.quantity <= foundProduct.product_quantity? product.quantity : new BadRequestError("Don't have enought quantity"),
                productId: foundProduct._id.toString()
            }
        }
    }))
}


module.exports ={
    findAllDraftsForShop,
    publishProductByShop,
    findAllPublishForShop,
    unPublishProductByShop,
    searchProductByUser,
    findAllProducts,
    findProductsByCategory,
    findProduct,
    updateProductById,
    checkProductByServer 
}