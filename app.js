const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const handleResponse = require('./service/handleResponse');
const postsRouter = require('./routes/posts');
const usersRouter = require('./routes/users');
const uploadRouter = require('./routes/upload');

const app = express();

require("./connections");

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(postsRouter);
app.use('/users', usersRouter);
app.use('/upload', uploadRouter);

app.use(function(err, req, res, next) {
  // dev
  err.statusCode = err.statusCode || 500;
  if (process.env.NODE_ENV === "development") {
    return handleResponse.errorDev(err, res);
  }
  
  // production
  if (err.name === "ValidationError") {
    err.isOperational = true;
    err.statusCode = 400;
    err.message = "資料欄位未填寫正確，請重新輸入"
    return handleResponse.errorProd(err, res);
  }else if(err.name === "SyntaxError") {
    err.isOperational = true;
    err.statusCode = 401;
    err.message = "資料格式未填寫正確，請重新輸入"
    return handleResponse.errorProd(err, res);
  }else if(err.name === "TokenExpiredError") {
    err.isOperational = true;
    err.statusCode = 400;
    err.message = "簽證已到期，請重新登入"
    return handleResponse.errorProd(err, res);
  }else if(err.name === "CastError") {
    err.isOperational = true;
    err.statusCode = 400;
    err.message = "無此貼文 ID"
    return handleResponse.errorProd(err, res);
  }
  handleResponse.errorProd(err, res);
})
app.use(function(req, res, next) {
  handleResponse.errorNew(404, "找不到這個路由", next);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("未捕捉到的 rejection：", promise, "原因：", reason);
  // 記錄於 log 上
});
process.on('uncaughtException', reason => {
  // 記錄錯誤下來，等到服務都處理完後，停掉該 process
  console.error('Uncaughted Exception！')
  console.error(reason);
  console.error(reason.name); // ReferenceError
  console.error(reason.message); // thisCauseAnError is not defined
  console.error(reason.stack); // ReferenceError: thisCauseAnError is not defined ......
  process.exit(1);
});

module.exports = app;

