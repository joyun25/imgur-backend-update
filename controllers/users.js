const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const handleResponse = require("../service/handleResponse");
const permission = require("../service/permission");
const User = require("../models/users");

// function: 驗證密碼是否有包含英文和數字且大於 8 碼
function checkPassword(password) {
  // 至少一數字、至少一英文字母、至少八字元
  const re = /^(?=.*\d)(?=.*[a-zA-Z]).{8,}$/
  const result = re.test(password)

  return result
}

const users = {
  signUp: handleResponse.errorAsync(async(req, res, next) => {
    let { name, email, password} = req.body;

    // email 是否已被註冊
    if (await User.findOne({ email })){
      return next(handleResponse.errorNew("400", "此信箱已被註冊", next));
    }
    
    // 暱稱至少兩個字元
    if (!validator.isLength(name, { min: 2 })) {
      errors.push('暱稱至少兩個字元')
    }

    // 內容不可為空
    if(!name || !email || !password){
      return next(handleResponse.errorNew("400", "欄位不可為空", next));
    }
    
    // 密碼須包含英文和數字且大於 8 碼
    if(!checkPassword(password)){
      return next(handleResponse.errorNew("400", "密碼須包含英文和數字且大於 8 碼", next));
    }
    
    // 是否為 email
    if(!validator.isEmail(email)){
      return next(handleResponse.errorNew("400", "Email 格式不正確", next));
    }
    
    // 密碼加密
    password = await bcrypt.hash(req.body.password, 12);
    const newUser = await User.create({
      name,
      email,
      password
    });
    
    permission.generateSendJWT(newUser, "201", res);
  }),
  signIn: handleResponse.errorAsync(async(req, res, next) => {
    const { email, password } = req.body;
    
    if(!email || !password) {
      return next(handleResponse.errorNew("400", "帳號密碼不可為空", next));
    }else if(!validator.isLength(password, {min: 8})){
      return next(handleResponse.errorNew("400", "密碼數字低於 8 碼", next));
    }else if(!validator.isEmail(email)){
      return next(handleResponse.errorNew("400", "Email 格式不正確", next));
    }else{
      const user = await User.findOne({ email }).select("+password");
      const auth = bcrypt.compare(password, user.password);
      if(!auth || !user){
        return next(handleResponse.errorNew("400", "您的密碼不正確", next));
      }
      
      permission.generateSendJWT(user, "200", res);
    }
  }),
  getUsers: handleResponse.errorAsync(async(req, res, next) => {
    const allUsers = await User.find();
    handleResponse.success(res, "資料讀取成功", allUsers);
  }),
  getUser: handleResponse.errorAsync(async(req, res, next) => {
    const user = await User.findById(req.params.id);
    handleResponse.success(res, "資料讀取成功", user);
  }),
  editUser: handleResponse.errorAsync(async(req, res, next) => {
    if(req.user.id !== req.params.id){
      return handleResponse.errorNew("401", "您無此權限", next);
    }
    const { name, gender, photo } = req.body;
    const id = req.params.id;

    // 暱稱至少兩個字元
    if (!validator.isLength(name, { min: 2 })) {
      errors.push('暱稱至少兩個字元')
    }

    if(name.trim()){
      const editUser = await User.findByIdAndUpdate(`${id}`, {name, gender, photo}, {new: true});
      if(!editUser){
        return handleResponse.errorNew("400", "編輯失敗", next);
      }else{
        const users = await User.find();
        handleResponse.success(res, "編輯成功", users)
      }
    }else{
      return handleResponse.errorNew("400", "暱稱未填", next);
    }
  }),
  updatePassword: handleResponse.errorAsync(async(req, res, next) => {
    
    const { password, confirmPassword } = req.body;
    
    // 欄位不可為空
    if(!password || !confirmPassword) {
      return next(handleResponse.errorNew("400", "密碼欄位不可為空", next));
    }
    
    // 密碼 8 碼以上
    if(!validator.isLength(password, {min: 8})){
      return next(handleResponse.errorNew("400", "密碼數字低於 8 碼", next));
    }
    
    // 比對密碼是否一致
    if(password !== confirmPassword) {
      return next(handleResponse.errorNew("400", "密碼不一致", next));
    }
    
    // 新密碼要再加密一次
    newPassword = await bcrypt.hash(password, 12);
    
    // 進入資料庫，取使用者 ID 更新密碼
    const user = await User.findByIdAndUpdate(req.user.id, {
      password: newPassword
    });
    
    // 傳送 token 給使用者
    permission.generateSendJWT(user, "200", res);
  }),
}

module.exports = users;