'use strict'

const {mongoose,model,Schema,Types} = require('mongoose'); // Erase if already required


const DOCUMENT_NAME= 'Order'
const COLLECTION_NAME= 'Orders'

// Declare the Schema of the Mongo model

const orderSchema = new Schema({
    order_userId: {type: String, required: true},
    order_checkout: {type: Object, default: {}},
    /*
        order_checkout: {
            totalPrice,
            totalAplyDiscount,
            feeShip
        }
    
    */
   order_shipping: {type: Object, default:{}},
   /*
        order_shipping{
            street,
            city,
            country
        }
   */
    order_payment: {type: Object, default:{}},
    order_products: {type: Array, required: true},
    order_trackingNumber: {type: String, default: '#0000112032025'},
    order_status: {type: String, enum: ['pending', 'confirmed',
        'canceled','delivered'
    ], default: 'pending'},

},{
    timestamps:true,
    collection: COLLECTION_NAME
})

//Export the model
module.exports = {
    order: mongoose.model(DOCUMENT_NAME, orderSchema) 
} 