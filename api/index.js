const compression = require("compression");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const app = express();
const cors = require('cors')
const cookieParser= require('cookie-parser')
// init middlewares
app.use(cookieParser())

const corsConfig = {
  orgin: "*",
  credetial: true,
  methods: ["GET","POST", "PUT", "DELETE"],
  
}
app.options("", cors(corsConfig))
app.use(cors(corsConfig))
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get('/getCookie', (req,res) => {
  console.log(req.cookies);
  res.send('check cookie')
})


//init db
require("../src/dbs/init.mongodb.cjs");
const { checkOverLoad } = require("../src/helpers/check.connect");
checkOverLoad();

//init router

app.use("/", require("../src/routes"));

//handling err
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404
  next(error);
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  return res.status(status).json({
    status: "error",
    code: status,
    stack: error.stack,
    message: error.message || "Internal Server Error",
  });
});

module.exports = app;
