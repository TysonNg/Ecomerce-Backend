'use strict'

const dev = {
    app: {
        port: process.env.DEV_APP_PORT
    },
    db:{
       userName: process.env.DEV_DB_USERNAME,
       pass: process.env.DEV_DB_PASSWORD,
       name:process.env.DEV_DB_NAME
    }
}

const pro = {
    app: {
        port: process.env.PRO_APP_PORT
    },
    db:{
       userName: process.env.PRO_DB_USERNAME,
       pass: process.env.DEV_DB_PASSWORD,
       name: process.env.DEV_DB_NAME
    }
}

const config = {dev, pro}
const env = process.env.NODE_ENV || 'dev'

module.exports = config[env]