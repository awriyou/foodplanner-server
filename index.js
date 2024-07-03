const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = express();
const port = 3000;
const recipeRouter = require('./routes/recipes');
const categoryRouter = require('./routes/categories');

dotenv.config();
mongoose
  .connect(process.env.MONGODB)
  .then(() => console.log('DB Connected'))
  .catch((err) => console.log(err));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/recipes', recipeRouter);
app.use('/api/categories', categoryRouter);

app.listen(process.env.PORT || port, () =>
  console.log(`app listening on port ${process.env.PORT}!`)
);
