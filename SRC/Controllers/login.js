const Chat = require('../model/chatSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please enter email and password'
      });
    }

    
    const user = await Chat.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Invalid user'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Incorrect password'
      });
    }

    
    const token = jwt.sign(
      { id: user._id, role: user.role, email:user.email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error'
    });
  }
};
module.exports = { loginUser };


