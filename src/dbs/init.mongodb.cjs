"use strict";

require('dotenv').config()
// const {db: {userName, pass, name}} = require('../config/config.mongodb')
const mongoose = require("mongoose");
const {countConnect} = require('../helpers/check.connect')


// const connectString = `mongodb+srv://${userName}:${pass}@${name}.t8agq.mongodb.net/`;
const connectString = process.env.MONGODB_URI;

console.log(`connect string: ${connectString}`);


class Database {
  constructor() {
    this.connect();
  }

  //connect mongoDB
  connect(type = "mongodb") {
    if (1 === 1) {
      mongoose.set("debug", true);
      mongoose.set("debug", { color: true });

    }
    mongoose.connect(connectString)
    
      .then(()=>  console.log(`Connected Mongodb Success`, countConnect()))
      .catch((err) => console.log(`Error connect!`, err))

  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

const instanceMongodb = Database.getInstance();

module.exports = {instanceMongodb}
