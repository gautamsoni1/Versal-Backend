const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
require("dotenv").config();
const bcrypt = require('bcrypt');
const Chat = require('../model/chatSchema');
const cloudinary = require('../config/cloudinary');

const SECRET = "yourSecretKey"; 

async function createUser(req, res) {
  const { firstName, lastName, email, companyName, phone, password } = req.body;

  if (!firstName || !lastName || !email || !companyName || !phone || !password) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  const namePattern = /^[A-Za-z][A-Za-z]+$/;
  const emailPattern = /^[A-Za-z]{2}[\w.+-]*@[A-Za-z]+(?:\.[A-Za-z]+)*\.com$/;
  const companyPattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
  const phonePattern = /^\d{10}$/;
  const passwordPattern = /^(?=.*[A-Z])(?=.*[\W_])(?=.*\d).+$/;

  if (!namePattern.test(firstName) || !namePattern.test(lastName)) {
    return res.status(400).json({
      message: 'First Name and Last Name must contain only letters and start with a letter'
    });
  }

  if (!emailPattern.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email' });
  }

  if (!companyPattern.test(companyName)) {
    return res.status(400).json({ message: 'Company name must contain only letters' });
  }

  if (!phonePattern.test(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
  }

  if (!passwordPattern.test(password)) {
    return res.status(400).json({ message: 'Password must contain uppercase, special character, and number' });
  }

  try {
    const emailExists = await Chat.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ message: 'This email already exists' });
    }

    const phoneExists = await Chat.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ message: 'This phone number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 1: Create the user WITHOUT token/user fields yet
    const newChat = new Chat({
      firstName,
      lastName,
      email,
      companyName,
      phone,
      password : hashedPassword
    });

    // Step 2: Generate token using the user’s `_id`
    const token = jwt.sign(
      { id: newChat._id, role: "user" },
      SECRET,
      { expiresIn: "1d" }
    );

    // Step 3: Set the token and user fields
    newChat.token = token;
    newChat.user = newChat._id; // self-reference

    // Step 4: Save the document now with all required fields
    await newChat.save();

    const userResponse = newChat.toObject();
    delete userResponse.password;
    
    userResponse.token = token;
    return res.status(201).json({
      message: 'User created successfully',
      data: userResponse,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

const getUser = async (req, res) => {
  try {
    let users;
    let totalCount;

    if (req.user.role === 'admin') {
     
      users = await Chat.find({});
      totalCount = await Chat.countDocuments();
    } else {
      
      users = await Chat.find({ _id: req.user.id });
      totalCount = 1;
    }

    return res.status(200).json({
      message: "Users fetched successfully",
      totalUsers: totalCount,
      users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const self = async (req, res) => {
  try {
    console.log(req,"userreq===>????");
    const user = req.user; 
    const userInfo = await Chat.findById(user._id);
      if (!userInfo) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const userObj = userInfo.toObject();
    const {password,...safeUser} = userObj;

   return res.status(200).json({
      success: true,
      message: "User data fetched successfully",
      user : safeUser
    });
  } catch (err) {
    console.error("Error in /self:", err);
    return res.status(500).json({ 
      success: false, 
      message: "internal server error",
      err : err.message
    });
  }
};

const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, companyName, phone } = req.body;

  try {
    const updateData = { firstName, lastName, companyName, phone };

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      updateData.profilePhoto = result.secure_url;
    }

    const updated = await Chat.findByIdAndUpdate(userId, updateData, {
      new: true
    }).select("-password -token");

    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated", user: updated });

  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        console.log("Request received:", req.body);

        if (!email) {
            return res.status(401).json({ Success: false, message: "Please provide email" });
        }

        const user = await Chat.findOne({ email });
        if (!user) {
            return res.status(400).json({ Success: false, message: "User not found. Please register." });
        }

        const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY, {
            expiresIn: "1h",
        });

        const transporter = nodemailer.createTransport({
            service: "gmail",
            secure: true,
            auth: {
                user: process.env.MY_GMAIL,
                pass: process.env.MY_PASSWORD,
            },
        });

        const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;
        const receiver = {
            from: "gautamsoni.hpp@gmail.com",
            to: email,
            subject: "Password Reset Request",
            html: `
                <h2>Reset Your Password</h2>
                <p>Hi ${user.firstName || 'User'},</p>
                <p><a href="${resetLink}">Reset Password</a></p>
            `,
        };

        transporter.sendMail(receiver, (error, info) => {
            if (error) {
                console.log("Error sending email:", error);
                return res.status(500).json({ Success: false, message: "Failed to send email", error: error.message });
            }
            console.log("Email sent:", info);
            return res.status(200).json({ message: "Password reset link sent successfully to your email." });
        });

    } catch (error) {
        console.log("Server Error:", error);
        return res.status(500).json({ Success: false, message: "Internal server error", error: error.message });
    }
};

const resetPassword = async (req,res) => {
   try{
     const {token} = req.params;
     const {password} = req.body;

     if(!password){
      return res.status(400).send({ message: "Please provide password" });
     }

     const decode = jwt.verify(token,process.env.JWT_SECRET_KEY);

     const user = await Chat.findOne({email:decode.email});

    const hashedPassword = await bcrypt.hash(password, 10);
     user.password =hashedPassword;
     await user.save();

     return res.status(200).send({message:"Password reset successfully"});
   } catch(error) {
     return res.status(500).send({ message: error });
   }
};

const sendEmailOtp = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized: No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Chat.findById(decoded.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
    user.otpData = {
      otp: otp,
      createdAt: new Date()
    };
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_GMAIL,
        pass: process.env.MY_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: "gautamsoni.hpp@gmail.com",
      to: user.email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
    });

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("OTP Send Error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const verifyOtp = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { otp } = req.body;

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Chat.findById(decoded.id);

    if (!user || !user.otpData) {
      return res.status(400).json({ message: "OTP not found" });
    }

   
    const createdTime = new Date(user.otpData.createdAt).getTime();
    const now = Date.now();
    const diff = now - createdTime;

    if (diff > 5 * 60 * 1000) { 
      user.otpData = undefined; 
      await user.save();
      return res.status(400).json({ message: "OTP expired, please resend" });
    }

   
    if (user.otpData.otp === otp) {
      user.otpData = undefined; 
      await user.save();
      return res.status(200).json({ message: "OTP verified" });
    } else {
      return res.status(400).json({ message: "Invalid OTP" });
    }

  } catch (err) {
    console.error("Verify OTP Error:", err);
    return res.status(401).json({ message: "Token expired or invalid" });
  }
};
 
module.exports = {
  createUser,
  getUser,
  forgotPassword,
  resetPassword,
  self,
  updateProfile,
  sendEmailOtp,
  verifyOtp
};
