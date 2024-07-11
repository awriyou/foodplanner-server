const User = require('../models/Users');

const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');

module.exports = {
  login: async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(401).json({ message: 'Wrong credentials' });
      }

      const hashedPassword = CryptoJS.AES.decrypt(
        user.password,
        process.env.SECRET
      );
      const hashedpass = hashedPassword.toString(CryptoJS.enc.Utf8);

      if (hashedpass !== req.body.password) {
        return res.status(401).json({ message: 'Wrong credentials' });
      }

      const accessToken = jwt.sign(
        {
          id: user._id,
        },
        process.env.JWT_SEC,
        { expiresIn: '7d' }
      );

      const { password, __v, createdAt, updateAt, ...userData } = user._doc;

      res.status(200).json({ ...userData, token: accessToken });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  },
  register: async (req, res) => {
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: CryptoJS.AES.encrypt(
        req.body.password,
        process.env.SECRET
      ).toString(),
    });
    try {
      await newUser.save();

      res.status(201).json({ message: 'User succesfully created' });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  },
  // changePassword: async (req, res) => {},

  getUser: async (req, res) => {
    try {
      const userId = req.params.id;

      const user = await User.findById(userId).populate(
        'favorites planner.recipes'
      );
      if (!user) return res.status(404).json({ message: 'User not found' });

      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  getFavorite: async (req, res) => {
    try {
      const userId = req.params.id;

      const user = await User.findById(userId).populate('favorites');
      if (!user) return res.status(404).json({ message: 'User not found' });

      res.status(200).json(user.favorites);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  addFavorite: async (req, res) => {
    try {
      const userId = req.body.id;
      const { recipeId } = req.body;

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (user.favorites.includes(recipeId)) {
        return res.status(400).json({ message: 'Recipe already in favorites' });
      }

      user.favorites.push(recipeId);
      await user.save();

      res.status(200).json({ message: 'Recipe added to favorites' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  deleteFavorite: async (req, res) => {
    try {
      const userId = req.params.id;
      const { recipeId } = req.body;

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (!user.favorites.includes(recipeId)) {
        return res.status(400).json({ message: 'Recipe not in favorites' });
      }

      user.favorites.pull(recipeId);
      await user.save();

      res.status(200).json({ message: 'Recipe removed from favorites' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  getPlanner: async (req, res) => {
    try {
      const userId = req.params.id;

      // Populate planner dan semua field dalam recipes
      const user = await User.findById(userId).populate({
        path: 'planner',
        populate: {
          path: 'recipes',
          model: 'Recipe', // Pastikan 'Recipe' sesuai dengan nama model resep Anda
        },
      });

      if (!user) return res.status(404).json({ message: 'User not found' });

      // Format planner data untuk frontend
      const formattedPlanner = user.planner.map((planner) => ({
        id: planner._id,
        date: planner.date,
        recipes: planner.recipes.map((recipe) => ({
          id: recipe._id,
          name: recipe.name,
          description: recipe.description,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          recipe_img: recipe.recipe_img,
          id_cat: recipe.id_cat,
        })),
      }));

      res.status(200).json(formattedPlanner);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  addPlanner: async (req, res) => {
    try {
      const userId = req.body.id;
      const { date, recipeId } = req.body;

      const user = await User.findById(userId).populate('planner.recipes');
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Mengubah date menjadi Date object
      const dateObj = new Date(date);

      // Mengecek apakah sudah ada planner dengan tanggal yang sama
      let planner = user.planner.find(
        (planner) => planner.date.getTime() === dateObj.getTime()
      );

      if (planner) {
        // Jika planner dengan tanggal yang sama ditemukan, tambahkan resep baru
        if (!planner.recipes.some((recipe) => recipe.equals(recipeId))) {
          planner.recipes.push(recipeId);
        } else {
          return res
            .status(400)
            .json({ message: 'Recipe already in planner for this date' });
        }
      } else {
        // Jika planner dengan tanggal tersebut belum ada, buat entri baru
        user.planner.push({ date: dateObj, recipes: [recipeId] });
      }

      await user.save();
      res.status(200).json({ message: 'Recipe added to planner' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  deletePlanner: async (req, res) => {
    try {
      const userId = req.params.id;
      const { plannerId, recipeId } = req.body;

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Mencari planner dengan plannerId yang sesuai
      let planner = user.planner.id(plannerId);
      if (!planner) {
        return res.status(400).json({ message: 'Planner not found' });
      }

      // Mengecek apakah resep ada dalam planner
      let recipeIndex = planner.recipes.indexOf(recipeId);
      if (recipeIndex === -1) {
        return res.status(400).json({ message: 'Recipe not in planner' });
      }

      // Menghapus resep dari planner
      planner.recipes.splice(recipeIndex, 1);

      // Menghapus planner jika tidak ada resep yang tersisa
      if (planner.recipes.length === 0) {
        planner.remove();
      }

      await user.save();

      res.status(200).json({ message: 'Recipe removed from planner' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },
};
