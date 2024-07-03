const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema(
  {
    id_recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Recipe', RecipeSchema);
