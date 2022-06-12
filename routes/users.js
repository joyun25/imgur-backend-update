const express = require("express");
const router = express.Router();
const usersControllers = require("../controllers/users");
const permission = require("../service/permission");

router.post("/sign_up", usersControllers.signUp);
router.post("/sign_in", usersControllers.signIn);
router.get("/users", permission.isAuth, usersControllers.getUsers);
router.get("/user/:id", permission.isAuth, usersControllers.getUser);
router.patch("/user/:id/edit", permission.isAuth, usersControllers.editUser);
router.post("/user/updatePassword", permission.isAuth, usersControllers.updatePassword);

module.exports = router;