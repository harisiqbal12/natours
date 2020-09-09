const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

//ROUTES

const routes = express.Router();

routes.post('/signup', authController.signup);
routes.post('/login', authController.login);
routes.get('/logout', authController.logout);

routes.post('/forgotPassword', authController.forgetPassword);
routes.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware
routes.use(authController.protect);

routes.get('/me', userController.getMe, userController.getUser);
routes.patch('/updateMyPassword', authController.updatePassword);
routes.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);

routes.delete('/deleteMe', userController.deleteMe);

routes
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

routes
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = routes;
