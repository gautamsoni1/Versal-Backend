const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const chatSchema = new mongoose.Schema({
  firstName:  {
               type: String,
               required: true 
              },
  lastName:   {
               type: String,
               required: true 
              },
  email:      {
               type: String,
               required: true,
                unique: true 
              },
  companyName:{
               type: String,
               required: true 
              },
  phone: { 
          type: Number, 
          required: true,
         },
  password:{ 
            type: String,
            required: true 
          },     
  role : {
    type : String,
    enum : ["admin","user"],
    default: "user"
  } ,
  profilePhoto: {
    type: String
  },  
   otpData: {
    otp: String,
    createdAt: Date
  }
});

module.exports = mongoose.model('Chat', chatSchema);
