'use strict'

const { BadRequestError } = require('../core/error.responese')
const {product,clothing,electronics,jewelry} = require('../models/product.model')
const {insertInventory} = require('../models/repositories/iventory.repo')
const { findAllDraftsForShop, publishProductByShop,findAllPublishForShop, unPublishProductByShop, searchProductByUser, findAllProducts, findProduct, updateProductById } = require('../models/repositories/product.repo')
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
    //END QUERY

    static async searchProducts({keySearch}){
        return await searchProductByUser({keySearch})
    }

    static async findAllProducts({limit = 50, sort= 'ctime',filter= {isPublished: true},page = 1}){
        return await findAllProducts({limit,sort,filter,page,
            select: ['product_name', 'product_price','product_thumb', 'product_shop']
        })
    }

    static async findProduct({product_id}){
        return await findProduct({product_id,
            unSelect:['__v']
        })
    }

}


class Product{
    constructor({product_name,product_price,product_type,product_shop,
        product_description,product_thumb,product_quantity,product_attributes})
    {
        this.product_name = product_name
        this.product_price = product_price
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
        const newJewelry = await jewelry.create(this.product_attributes)
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

ProductFactory.registerProductType('Electronics', Electronics)
ProductFactory.registerProductType('Jewelrys', Jewelrys)
ProductFactory.registerProductType('Clothing', Clothing)


module.exports= ProductFactory