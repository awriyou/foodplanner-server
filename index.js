const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = express();
const port = 3000;

dotenv.config();
mongoose
  .connect(process.env.MONGODB)
  .then(() => console.log('db connected'))
  .catch((err) => console.log(err));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));



app.listen(process.env.PORT || port, () =>
  console.log(`app listening on port ${process.env.PORT}!`)
);
