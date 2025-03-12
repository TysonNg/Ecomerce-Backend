'use strict'

const {model, Schema} = require('mongoose')

const DOCUMENT_NAME= 'discount'
const COLLECTION_NAME= 'discounts'

// Declare the Schema of the Mongo model

const discountSchema = new Schema({
    discount_name:{ type: String, required: true},
    discount_description: {type: String, required: true},
    discount_type: {type: String,
        enum: ['fix_amount', 'percentage'] 
    },
    discount_value: {type: Number, required: true}, //ex: fix_amout = 10.000 VND, percentage = 10%
    discount_code: {type: String, required: true}, // validCode Of Discount
    discount_start_date: {type: Date, required: true},
    discount_end_date: {type: Date, required: true},
    discount_max_use: {type: Number, required: true}, //number Of max discount can use
    discount_used_count: {type: Number, required: true}, //number Of discount used
    discount_user_used: {type: Array, default:[] }, // User used discount
    discount_max_uses_per_user: {type: Number, required: true}, // number of max uses per user
    discount_min_order_value:{type: Number, required: true},
    discount_max_order_value:{type: Number, required: true},
    discount_shopId: {type:Schema.Types.ObjectId, ref: 'User'},
    discount_is_active: {type: Boolean, default: true},
    discount_applies_to: {type: String, required: true,
        enum:['all', 'specific']
    },
    discount_product_ids: {type:Array, default:[]} //number Of products be applied
},{
    timestamps:true,
    collection: COLLECTION_NAME
})

//Export the model
module.exports = model(DOCUMENT_NAME, discountSchema);