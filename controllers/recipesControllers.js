const Recipe = require('../models/Recipes');
const User = require('../models/Users');

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
  createRecipes: async (req, res) => {
    const newRecipes = req.body; // Asumsikan req.body adalah array objek resep
    try {
      await Recipe.insertMany(newRecipes); // Gunakan insertMany untuk bulk insertion
      res.status(200).json('Recipes created successfully');
    } catch (error) {
      res.status(500).json('Failed to create the Recipes');
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
  getRecipeByCategory: async (req, res) => {
    try {
      const recipes = await Recipe.find({ id_cat: req.params.categoryId })
        .populate('id_cat')
        .sort({ createdAt: -1 });

      if (!recipes.length) {
        return res
          .status(404)
          .json({ message: 'Resep dengan kategori tersebut tidak ditemukan' });
      }

      res.status(200).json(recipes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Gagal mengambil resep' });
    }
  },

  getPopularRecipes: async (req, res) => {
    try {
      // Agregasi untuk menghitung jumlah favorit
      const favoriteCounts = await User.aggregate([
        { $unwind: '$favorites' },
        { $group: { _id: '$favorites', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      const popularRecipeIds = favoriteCounts.map((fav) => fav._id);

      // Mengambil detail resep
      const popularRecipes = await Recipe.find({
        _id: { $in: popularRecipeIds },
      });

      // Menggabungkan data resep dengan jumlah favorit
      const popularRecipesWithCount = popularRecipes.map((recipe) => {
        const countData = favoriteCounts.find((fav) =>
          fav._id.equals(recipe._id)
        );
        return {
          recipe,
          favoriteCount: countData ? countData.count : 0,
        };
      });

      res.status(200).json(popularRecipesWithCount);
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Error fetching popular recipes', error });
    }
  },

  getRecipeFavoriteCounts: async (req, res) => {
    const { recipeId } = req.params;

    try {
      const count = await User.countDocuments({ favorites: recipeId });

      res.status(200).json({ count });
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Error counting favorite recipes', error });
    }
  },
};
