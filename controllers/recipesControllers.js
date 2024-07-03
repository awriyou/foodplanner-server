const Recipe = require('../models/Recipes');

module.exports = {
  createRecipe: async (req, res) => {
    const newRecipe = new Recipe(req.body);
    try {
      await newRecipe.save();
      res.status(200).json('Recipe created success');
    } catch (error) {
      res.status(500).json('Failed to create the Recipe');
    }
  },
  getAllRecipe: async (req, res) => {
    try {
      const recipes = await Recipe.find()
        .populate('id_cat')
        .sort({ createdAt: -1 });
      res.status(200).json(recipes);
    } catch (error) {
      res.status(500).json('Failed to get the Recipes');
    }
  },
  getRecipe: async (req, res) => {
    try {
      const recipe = await Recipe.findById(req.params.id).populate('id_cat');
      res.status(200).json(recipe);
    } catch (error) {
      res.status(500).json('Failed to get the Recipe');
    }
  },
  searchRecipe: async (req, res) => {
    try {
      const result = await Recipe.aggregate([
        {
          $search: {
            index: 'foodplannerApp',
            text: {
              query: req.params.key,
              path: {
                wildcard: '*',
              },
            },
          },
        },
      ]);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json('failed to get the Recipes');
    }
  },
};
