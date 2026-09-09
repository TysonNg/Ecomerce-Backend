'use strict'

const { BadRequestError } = require('../core/error.responese')
const {product,clothing,electronics,jewelry, laptop, others} = require('../models/product.model')
const {insertInventory} = require('../models/repositories/iventory.repo')
const { findAllDraftsForShop, publishProductByShop,findAllPublishForShop, unPublishProductByShop, searchProductByUser, findAllProducts, findProduct, updateProductById, findProductsByCategory } = require('../models/repositories/product.repo')
const { removeUndefinedObject, updateNestedObjectParser } = require('../utils')

class ProductFactory{

    static productRegistry = {}

    static registerProductType(type,classRef){
        ProductFactory.productRegistry[type] = classRef
    }
    
    static async createProduct(type, payload){
        const productClass = ProductFactory.productRegistry[type]
        if(!productClass) throw new BadRequestError(`Error ${type}`)
        
        return new productClass(payload).createProduct()
    }

    static async updateProduct(type,productId, payload){
        const productClass = ProductFactory.productRegistry[type]
        if(!productClass) throw new BadRequestError(`Error ${type}`) 
        console.log(`productID::${productId}, type:: ${type}, payload ${payload}`)
               
        return new productClass(payload).updateProduct(productId)
    }



    //PUT//
    static async publishProductByShop({product_shop,product_id}){
        return await publishProductByShop({product_shop,product_id})
    }

    static async unPublishProductByShop({product_shop,product_id}){
        return await unPublishProductByShop({product_shop,product_id})
    }
    //END PUT//

    //QUERY//
    static async findAllDraftsForShop({product_shop, limit = 50, skip=0}){
        const query = {product_shop, isDraft: true}
        return await findAllDraftsForShop({query,limit,skip})
    }

    static async findAllPublishForShop({product_shop, limit = 50, skip=0}){
        const query = {product_shop, isPublished: true}
        return await findAllPublishForShop({query,limit,skip})
    }

    static async getProductsByShop({ idOrSlug, category, search, limit = 50, page = 1 }) {
        const Shop = require('../models/shop.model');
        const mongoose = require('mongoose');
        const isId = mongoose.isObjectIdOrHexString(idOrSlug);
        const shopFilter = isId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };
        const shop = await Shop.findOne({ ...shopFilter, status: 'active' }).select('_id name slug logo description createdAt').lean();
        if (!shop) return { shop: null, products: [], categories: [], total: 0 };

        const filter = {
            product_shop: shop._id,
            isPublished: true,
        };
        if (category && category !== 'all') {
            filter.product_type = category;
        }
        if (search && search.trim()) {
            filter.product_name = { $regex: search.trim(), $options: 'i' };
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [products, total, categories] = await Promise.all([
            product.find(filter)
                .sort({ _id: -1 })
                .skip(skip)
                .limit(Number(limit))
                .select(['product_name', 'product_price', 'product_thumb', 'product_slug', 'product_shop', 'product_prevPrice', 'product_type', 'product_ratingsAverage', 'product_ratingsAvenrage', 'product_reviewsCount'])
                .lean(),
            product.countDocuments(filter),
            product.distinct('product_type', { product_shop: shop._id, isPublished: true }),
        ]);

        return {
            shop,
            products,
            categories,
            total,
            page: Number(page),
            limit: Number(limit),
        };
    }
    //END QUERY

    static async searchProducts({keySearch}){
        return await searchProductByUser({keySearch})
    }

    static async findAllProducts({limit, sort= 'ctime',filter= {isPublished: true},page = 1}){
        return await findAllProducts({limit,sort,filter,page,
            select: ['product_name', 'product_price','product_thumb', 'product_shop','product_slug','product_prevPrice', 'product_ratingsAverage', 'product_ratingsAvenrage', 'product_reviewsCount']
        })
    }

    static async findProductsByCategory({
        limit, sort = 'ctime',category,page = 1
    })
    {
        return await findProductsByCategory({limit,sort,category,page, select:['product_name', 'product_price','product_thumb','product_slug', 'product_shop', 'product_prevPrice', 'product_ratingsAverage', 'product_ratingsAvenrage', 'product_reviewsCount']})

    }

    static async sortProductByViewsCount(){
        return await product.find({isPublished: true}).sort({product_viewsCount: -1}).limit(8)
    }

    static async hotDealProducts(){
        return await product.find({isPublished: true,$expr: {$gt:["$product_prevPrice", "$product_price"]}}).sort({product_viewsCount: -1}).limit(6).select('product_name product_price product_thumb product_shop product_prevPrice product_slug product_ratingsAverage product_ratingsAvenrage product_reviewsCount')

    }

    static async findProduct({product_id}){
        return await findProduct({product_id,
            unSelect:['__v']
        })
    }
    

}


class Product{
    constructor({product_name,product_price,product_prevPrice,product_type,product_shop,product_images,product_viewsCount,
        product_description,product_thumb,product_quantity,product_attributes})
    {
        this.product_name = product_name
        this.product_prevPrice = product_prevPrice
        this.product_price = product_price
        this.product_images = product_images
        this.product_viewsCount = product_viewsCount
        this.product_type = product_type
        this.product_description = product_description
        this.product_thumb = product_thumb
        this.product_quantity = product_quantity
        this.product_shop = product_shop
        this.product_attributes = product_attributes
    }

    //create new product
    async createProduct(productId){
        const newProduct =  await product.create({...this,_id: productId})
        if(newProduct){
            //add product_stock into inventory collection
            
            await insertInventory({
                productId: newProduct._id,
                shopId: this.product_shop,
                stock: this.product_quantity
            })
        }
        return newProduct
    }

    //update product
    async updateProduct(productId,objectParams){
        console.log('objectParamProdduct', objectParams);
        
        return await updateProductById({productId,objectParams, model: product})
    }
    
}

//Define sub-class for different product types chairs
class Clothing extends Product{
    async createProduct(){
        const newClothes = await clothing.create(
            {
            ...this.product_attributes,
            product_shop: this.product_shop
            }
        )
        if(!newClothes) throw new BadRequestError('Create new clothing error')
        const newProduct = await super.createProduct(newClothes._id)
        if(!newProduct) throw new BadRequestError('Create new newProduct error')

        return newProduct
    }

    async updateProduct(productId){
        //Remove attr has null or undefine
        const objectParams = removeUndefinedObject(this)   
        //check update at?
        if(objectParams.product_attributes){
            //update child
            console.log(objectParams.product_attributes);
            
            console.log('objectParamsAttr::',updateNestedObjectParser(objectParams.product_attributes));
            await updateProductById({productId,objectParams: updateNestedObjectParser(objectParams.product_attributes), model: electronics})
        }
        console.log('obj',removeUndefinedObject(objectParams));
        
        const updatedProduct = await super.updateProduct(productId,updateNestedObjectParser(objectParams))
        return updatedProduct

    }
   
}

//Define sub-class for different product types desks
class Electronics extends Product{
    async createProduct(){
        const newElectronic = await electronics.create({
            ...this.product_attributes,
            product_shop: this.product_shop
        })
        if(!newElectronic) throw new BadRequestError('Create new electronics error')
        const newProduct = await super.createProduct(newElectronic._id)
        if(!newProduct) throw new BadRequestError('Create new newProduct error')

        return newProduct   
    }

    async updateProduct(productId){
        //Remove attr has null or undefine
        const objectParams = removeUndefinedObject(this)   
        //check update at?
        if(objectParams.product_attributes){
            //update child
            console.log(objectParams.product_attributes);
            
            console.log('objectParamsAttr::',updateNestedObjectParser(objectParams.product_attributes));
            await updateProductById({productId,objectParams: updateNestedObjectParser(objectParams.product_attributes), model: electronics})
        }
        console.log('obj',removeUndefinedObject(objectParams));
        
        const updatedProduct = await super.updateProduct(productId,updateNestedObjectParser(objectParams))
        return updatedProduct

    }
}

//Define sub-class for different product types desks
class Jewelrys extends Product{
    async createProduct(){
        const newJewelry = await jewelry.create({
            ...this.product_attributes,
            product_shop: this.product_shop
        })
        if(!newJewelry) throw new BadRequestError('Create new jewelry error')
        const newProduct = await super.createProduct(newJewelry._id)
        if(!newProduct) throw new BadRequestError('Create new newProduct error')

        return newProduct
        
    }

    async updateProduct(productId){
        //Remove attr has null or undefine
        const objectParams = removeUndefinedObject(this)   
        //check update at?
        if(objectParams.product_attributes){
            //update child
            console.log(objectParams.product_attributes);
            
            console.log('objectParamsAttr::',updateNestedObjectParser(objectParams.product_attributes));
            await updateProductById({productId,objectParams: updateNestedObjectParser(objectParams.product_attributes), model: electronics})
        }
        console.log('obj',removeUndefinedObject(objectParams));
        
        const updatedProduct = await super.updateProduct(productId,updateNestedObjectParser(objectParams))
        return updatedProduct

    }
}

class KitchenAppliances extends Product{
    async createProduct(){
        const newClothes = await clothing.create(this.product_attributes)
        if(!newClothes) throw new BadRequestError('Create new clothing error')
        const newProduct = await super.createProduct(newClothes._id)
        if(!newProduct) throw new BadRequestError('Create new newProduct error')

        return newProduct
    }

    async updateProduct(productId){
        //Remove attr has null or undefine
        const objectParams = removeUndefinedObject(this)   
        //check update at?
        if(objectParams.product_attributes){
            //update child
            console.log(objectParams.product_attributes);
            
            console.log('objectParamsAttr::',updateNestedObjectParser(objectParams.product_attributes));
            await updateProductById({productId,objectParams: updateNestedObjectParser(objectParams.product_attributes), model: electronics})
        }
        console.log('obj',removeUndefinedObject(objectParams));
        
        const updatedProduct = await super.updateProduct(productId,updateNestedObjectParser(objectParams))
        return updatedProduct

    }
   
}

class HomeAppliances extends Product{
    async createProduct(){
        const newClothes = await clothing.create(this.product_attributes)
        if(!newClothes) throw new BadRequestError('Create new clothing error')
        const newProduct = await super.createProduct(newClothes._id)
        if(!newProduct) throw new BadRequestError('Create new newProduct error')

        return newProduct
    }

    async updateProduct(productId){
        //Remove attr has null or undefine
        const objectParams = removeUndefinedObject(this)   
        //check update at?
        if(objectParams.product_attributes){
            //update child
            console.log(objectParams.product_attributes);
            
            console.log('objectParamsAttr::',updateNestedObjectParser(objectParams.product_attributes));
            await updateProductById({productId,objectParams: updateNestedObjectParser(objectParams.product_attributes), model: electronics})
        }
        console.log('obj',removeUndefinedObject(objectParams));
        
        const updatedProduct = await super.updateProduct(productId,updateNestedObjectParser(objectParams))
        return updatedProduct

    }
}

class Laptop extends Product{
    async createProduct(){
        const newLaptop = await laptop.create(this.product_attributes)
        if(!newLaptop) throw new BadRequestError('Create new clothing error')
        const newProduct = await super.createProduct(newLaptop._id)
        if(!newProduct) throw new BadRequestError('Create new newProduct error')

        return newProduct
    }

    async updateProduct(productId){
        //Remove attr has null or undefine
        const objectParams = removeUndefinedObject(this)   
        //check update at?
        if(objectParams.product_attributes){
            //update child
            console.log(objectParams.product_attributes);
            
            console.log('objectParamsAttr::',updateNestedObjectParser(objectParams.product_attributes));
            await updateProductById({productId,objectParams: updateNestedObjectParser(objectParams.product_attributes), model: electronics})
        }        
        const updatedProduct = await super.updateProduct(productId,updateNestedObjectParser(objectParams))
        return updatedProduct

    }
}

class AudioVideo extends Product{
    async createProduct(){
        const newLaptop = await laptop.create(this.product_attributes)
        if(!newLaptop) throw new BadRequestError('Create new clothing error')
        const newProduct = await super.createProduct(newLaptop._id)
        if(!newProduct) throw new BadRequestError('Create new newProduct error')

        return newProduct
    }

    async updateProduct(productId){
        //Remove attr has null or undefine
        const objectParams = removeUndefinedObject(this)   
        //check update at?
        if(objectParams.product_attributes){
            //update child
            console.log(objectParams.product_attributes);
            
            console.log('objectParamsAttr::',updateNestedObjectParser(objectParams.product_attributes));
            await updateProductById({productId,objectParams: updateNestedObjectParser(objectParams.product_attributes), model: electronics})
        }        
        const updatedProduct = await super.updateProduct(productId,updateNestedObjectParser(objectParams))
        return updatedProduct

    }
}

class Gadget extends Product{
    async createProduct(){
        const newGadget = await others.create(this.product_attributes)
        if(!newGadget) throw new BadRequestError('Create new clothing error')
        const newProduct = await super.createProduct(newGadget._id)
        if(!newProduct) throw new BadRequestError('Create new newProduct error')

        return newProduct
    }

    async updateProduct(productId){
        //Remove attr has null or undefine
        const objectParams = removeUndefinedObject(this)   
        //check update at?
        if(objectParams.product_attributes){
            //update child
            console.log(objectParams.product_attributes);
            
            console.log('objectParamsAttr::',updateNestedObjectParser(objectParams.product_attributes));
            await updateProductById({productId,objectParams: updateNestedObjectParser(objectParams.product_attributes), model: electronics})
        }        
        const updatedProduct = await super.updateProduct(productId,updateNestedObjectParser(objectParams))
        return updatedProduct

    }
}


class Others extends Product{
    async createProduct(){
        const newOther = await others.create(this.product_attributes)
        if(!newOther) throw new BadRequestError('Create new other error')
        const newProduct = await super.createProduct(newOther._id)
        if(!newProduct) throw new BadRequestError('Create new other error')

        return newProduct
    }

    async updateProduct(productId){
        //Remove attr has null or undefine
        const objectParams = removeUndefinedObject(this)   
        //check update at?
        if(objectParams.product_attributes){
            //update child
            console.log(objectParams.product_attributes);
            
            console.log('objectParamsAttr::',updateNestedObjectParser(objectParams.product_attributes));
            await updateProductById({productId,objectParams: updateNestedObjectParser(objectParams.product_attributes), model: electronics})
        }        
        const updatedProduct = await super.updateProduct(productId,updateNestedObjectParser(objectParams))
        return updatedProduct

    }
}

ProductFactory.registerProductType('electronics', Electronics)
ProductFactory.registerProductType('jewelrys', Jewelrys)
ProductFactory.registerProductType('clothing', Clothing)
ProductFactory.registerProductType('homeAppliances', HomeAppliances)
ProductFactory.registerProductType('kitchenAppliances', KitchenAppliances)
ProductFactory.registerProductType('laptop', Laptop)
ProductFactory.registerProductType('audioVideo', AudioVideo)
ProductFactory.registerProductType('gadget', Gadget)
ProductFactory.registerProductType('others', Others)



module.exports= ProductFactory