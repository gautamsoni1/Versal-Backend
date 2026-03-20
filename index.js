require('dotenv').config();
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const userRoutes = require('./SRC/Routes/Route');  
const connectDB = require('./SRC/config/connection');
const port = process.env.port || 8080;
const bodyParser = require('body-parser');
const authRoutes = require('./SRC/Routes/authRoutes');
const mongoose = require('mongoose');
const cors = require('cors');


app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectDB();

app.get("/", (req, res) => {
  res.send("Backend working");
});

app.use('/api', userRoutes);
app.use('/api', authRoutes);

app.use('/uploads', express.static('uploads'));



const PORT = process.env.PORT || 8080;
app.listen(8080, () => {
  console.log(`app listening on port ${port}`);
});


