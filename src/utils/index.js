'use strict'

const _= require('lodash')
const {Types} = require('mongoose')

const convertToObjectIdMongodb = id => new Types.ObjectId(`${id}`)

const getInfoData = ({fieleds = [], object={}}) => {
    return _.pick(object,fieleds)
}

const getSelectData = (select = [])=> {
    return Object.fromEntries(select.map(el=> [el,1]))
}

const unGetSelectData = (select = [])=> {
    return Object.fromEntries(select.map(el=> [el,0]))
}

const removeUndefinedObject = obj =>{
    Object.keys(obj).forEach(k =>{
        if(obj[k] == null){
            delete obj[k]
        }
    })
    return obj
}

const updateNestedObjectParser = (obj) =>{
    const final = {}
    Object.keys(obj).forEach(k=>{
        if(typeof obj[k] === 'object' && !Array.isArray(obj[k])){
            const response = updateNestedObjectParser(obj[k])
            Object.keys(response).forEach(a=>{
                final[`${k}.${a}`] = response[a]
            })
        }else{
            final[k] = obj[k]
        }
    })
    return final
}



module.exports = {
    getInfoData,
    getSelectData,
    unGetSelectData,
    removeUndefinedObject,
    updateNestedObjectParser,
    convertToObjectIdMongodb
}

