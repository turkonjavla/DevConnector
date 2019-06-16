const express = require('express');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

/* Middleware */
app.use(express.json());

app.get('/', (req, res) => {
  res.send('hello');
});

app.listen(PORT, process.env.IP, () => {
  console.log('Server is running');
});