const express = require('express');
const router = express.Router();
const { loginUser } = require('../Controllers/login');
const { createUser ,getUser ,self ,updateProfile ,sendEmailOtp ,verifyOtp } = require('../Controllers/controller');
const { forgotPassword , resetPassword } = require('../Controllers/controller');
const upload = require('../middleware/upload');
const { authenticateUser } = require('../middleware/authMiddleware');


router.post('/register', createUser);
router.post('/login', loginUser);
router.post('/otp-send' ,sendEmailOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password' , forgotPassword);
router.post("/reset-password/:token" ,resetPassword);
router.get('/get-user', authenticateUser, getUser);
router.get('/me' , authenticateUser , self);
router.put('/update-profile', authenticateUser , upload.single('profilePhoto'), updateProfile);

module.exports = router;


