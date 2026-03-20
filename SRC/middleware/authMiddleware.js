const jwt = require("jsonwebtoken");
const Chat = require("../model/chatSchema");


exports.authenticateUser = async (req, res, next) => {
  // 1. Extract Bearer token from header
  const authHeader = req.headers.authorization;
  // console.log(authHeader,"authHeader===>????")
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or malformed Authorization header.' });
  }
  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify the token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Fetch the user
    const user = await Chat.findById(payload.id).select('-password -token');
    if (!user) {
      return res.status(401).json({ message: 'Invalid token: user not found.' });
    }

    // 4. Attach to req
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    return res.status(401).json({ message: err });
  }
};