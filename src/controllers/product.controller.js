"use strict";

const ProductServices = require("../services/product.service");
const { OK, CREATED, SuccessResponse } = require("../core/success.response");

class ProductController {
  createProduct = async (req, res, next) => {
    new SuccessResponse({
      message: "Create new Product success!",
      metadata: await ProductServices.createProduct(req.body.product_type, {
        ...req.body,
        product_shop: req.user.userId,
      }),
    }).send(res);
  };

  //UPDATE PRODUCT
  updateProduct = async(req,res,next) =>{
    new SuccessResponse({
        message: "updateProduct success!",
        metadata: await ProductServices.updateProduct(req.body.product_type,req.params.productId,{
          ...req.body,
          product_shop: req.user.userId
        }),
      }).send(res);
  }
  
  publishProductByShop = async(req,res,next) =>{
    new SuccessResponse({
        message: "publishProductByShop success!",
        metadata: await ProductServices.publishProductByShop({
            product_id: req.params.id,
            product_shop: req.user.userId
        }),
      }).send(res);
}

    unPublishProductByShop = async(req,res,next) =>{
        new SuccessResponse({
            message: "publishProductByShop success!",
            metadata: await ProductServices.unPublishProductByShop({
                product_id: req.params.id,
                product_shop: req.user.userId
            }),
        }).send(res);
    }

  //QUERY//
  /**
   * @desc Get all drafts for shop
   * @param {Number} limit
   * @param {Number} skip 
   * @return {JSON}
   */
  getAllDraftsForShop = async (req, res, next) => {
    new SuccessResponse({
      message: "Get list Draft success!",
      metadata: await ProductServices.findAllDraftsForShop({
        product_shop: req.user.userId,
      }),
    }).send(res);
  };


  getAllPublishForShop = async (req, res, next) => {
    new SuccessResponse({
      message: "Get list getAllPublishForShop success!",
      metadata: await ProductServices.findAllPublishForShop({
        product_shop: req.user.userId,
      }),
    }).send(res);
  };

  getListSearchProduct = async (req, res, next) => {
    new SuccessResponse({
      message: "Get list getListSearchProduct success!",
      metadata: await ProductServices.searchProducts(req.params),
    }).send(res);
  };

  getAllProducts = async (req, res, next) => {
    new SuccessResponse({
      message: "Get list getAllProducts success!",
      metadata: await ProductServices.findAllProducts(req.query),
    }).send(res);
  };
 
  getAllProductsByCategory = async(req,res,next) => {
    new SuccessResponse({
      message: "Get list getAllProductsByCategory success!",
      metadata: await ProductServices.findProductsByCategory(req.query),
    }).send(res);
  }

  getProductsByViewsCount = async(req,res,next) => {
    new SuccessResponse({
      message: "Get list getProductsByViewsCount success!",
      metadata: await ProductServices.sortProductByViewsCount(),
    }).send(res);
  }

  
  getProduct = async (req, res, next) => {
    new SuccessResponse({
      message: "Get list getProduct success!",
      metadata: await ProductServices.findProduct({
        product_id: req.params.product_id
      },
    )}).send(res);
  };

  getHotDealProducts = async(req,res,next) => {
    new SuccessResponse({
      message: "Get list getHotDealProducts success!",
      metadata: await ProductServices.hotDealProducts(
    )}).send(res);
  }
  //END QUERY//

  
}

module.exports = new ProductController();
