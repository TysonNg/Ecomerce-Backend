'use strict'
//!dmbg

const {Schema, model} = require("mongoose"); // Erase if already required
const slugify = require('slugify')

const DOCUMENT_NAME = 'Product'
const COLLECTION_NAME = 'Products'

// Declare the Merchandise Schema of the Mongo model
const productSchema = new Schema({
  product_name: {
    type: String,
    required: true,
    index:true //ao gucci
  },
  product_price: {
    type: Number,
    required: true,
  },
  product_type: {
    type: String,
    required: true,
    enum:['Clothing','Electronics','Jewelrys']
  },
  product_description: {
    type: String,
    required: true,
    index:true
  },
  product_thumb: {
    type: String,
    required: true
  },
  product_slug: String, //ao-gucci
  product_quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  product_shop:{
    type: Schema.Types.ObjectId, ref: 'User'
  },
  product_attributes: {
    type: Schema.Types.Mixed, required: true
  },
  product_variations:{
    type:Array,
    default:[]
  },
  product_ratingsAvenrage:{
    type: Number,
    default: 4.5,
    min:[1,'Rating must be above 1.0'],
    max:[5,'Rating must be below 5.0'],
    set: (val) => Math.round(val*10)/10
  },
  isDraft:{type:Boolean, default: true, index: true, select: false},
  isPublished: {type: Boolean, default: false, index: true, select: false}
},{
    timestamps: true,
    collection: COLLECTION_NAME
});

//create index for search
productSchema.index({product_name: 'text', product_description:'text'})
//Document middleware: runs before .save() and .create()...
productSchema.pre('save', function(next){
  this.product_slug = slugify(this.product_name,{lower: true})
  next()
})

// define the product type = Desk
const clothingSchema = new Schema({
  brand:{type: String, required: true},
  size: String,
  material: String,
},{
  collection: 'clothing',
  timestamps: true
})

// define the product type = Chairs
const electronicSchema = new Schema({
  brand:{type: String, required: true},
  model: String,
  material: String,
  product_shop:{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
},{
  collection: 'electronics',
  timestamps: true
})

// define the product type = Wardrobe
const jewelrySchema = new Schema({
  brand:{type: String, required: true},
  size: String,
  material: String,
},{
  collection: 'jewelrys',
  timestamps: true
})


//Export the model
module.exports = {
 product: model(DOCUMENT_NAME, productSchema),
 clothing: model('clothing', clothingSchema),
 electronics: model('electronics', electronicSchema),
 jewelry: model('jewelry', jewelrySchema)
};
