
const express = require('express');
const router = express.Router();
const Chat = require('../model/chatSchema');
const bcrypt = require('bcrypt');

// Signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await Chat.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const user = new Chat({ email, password });
    await user.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Chat.findOne({ email, password });
   if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

    res.json({ message: "Login successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
