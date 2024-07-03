const Category = require('../models/Categories');

module.exports = {
  createCategory: async (req, res) => {
    const newCategory = new Category(req.body);
    try {
      await newCategory.save();
      res.status(200).json('Category created success');
    } catch (error) {
      res.status(500).json('Failed to create the Category');
    }
  },
  getAllCategory: async (req, res) => {
    try {
      const category = await Category.find().sort({ createdAt: -1 });
      res.status(200).json(category);
    } catch (error) {
      res.status(500).json('Failed to get the Recipes');
    }
  },
  getCategory: async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      res.status(200).json(category);
    } catch (error) {
      res.status(500).json('Failed to get the Category');
    }
  },
  
};
