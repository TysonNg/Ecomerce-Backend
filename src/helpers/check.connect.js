"use strict";

const mongoose = require('mongoose');
const os = require('os')
const process = require('process')
const _SECONDS = 5000
// count Connect
const countConnect = () => {
  const numConnection = mongoose.connections.length;
  console.log(`Num of connections: ${numConnection}`);
};

// check over load
const checkOverLoad = () => {
  setInterval( () =>{
    const numConnection = mongoose.connections.length;
    const numCores = os.cpus().length;
    const memoryUsage = process.memoryUsage().rss;

    const maxConnetctions = numCores * 5;
    // console.log(`Active connections: ${numConnection}`);
    // console.log(`Memory Usage: ${memoryUsage/1024/1024} MB`);
    
    if (numConnection > maxConnetctions){
      console.log(`Connection overload detected`);
      
    }
  }, _SECONDS) // Monitor every 5 seconds
}


module.exports = {
    countConnect,
    checkOverLoad
};
