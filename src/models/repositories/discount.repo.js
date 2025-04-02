'use strict'

const {
   unGetSelectData,
   getSelectData
} = require('../../utils')


const checkDiscountExist = async({model,filter}) =>{
    console.log(model)
    console.log(filter);
    
    
    return await model.findOne(filter)
}

const findAllDiscountCodeUnselect = async({
    limit = 50, page = 1, sort = 'ctime', filter,
    unselect, model
}) => {
        const skip = (page - 1) * limit;
        const sortBy = sort === 'ctime' ? {_id: -1} : {_id: 1}
        const documents = await model.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .select(unGetSelectData(unselect))
        .lean()
        console.log('document',documents);
        
        return documents
}

const findAllDiscountCodeSelect = async({
    limit = 50, page = 1, sort = 'ctime', filter,
    select, model
}) => {
        const skip = (page - 1) * limit;
        const sortBy = sort === 'ctime' ? {_id: -1} : {_id: 1}
        const documents = await model.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .select(getSelectData(select))
        .lean()
    
        return documents
}

const isProductOfDiscount = async ({
    discount_product_ids, products
}) => { 
       for(const product of products){
        
            if(!(discount_product_ids.includes(product.productId.toString()))){
                return false
          }
        }
        return true
       

}


module.exports = {
    findAllDiscountCodeUnselect,
    findAllDiscountCodeSelect,
    checkDiscountExist,
    isProductOfDiscount
}