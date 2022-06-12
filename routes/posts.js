const express = require('express');
const router = express.Router();
const postsControllers = require("../controllers/posts");
const permission = require("../service/permission");

router.get('/posts', permission.isAuth, postsControllers.getPosts);
router.post('/post', permission.isAuth, postsControllers.createPosts);
router.delete('/posts', permission.isAuth, postsControllers.deleteAllPosts);
router.delete('/post/:id', permission.isAuth, postsControllers.deleteOnePost);
router.patch('/post/:id', permission.isAuth, postsControllers.updatePosts);

module.exports = router;