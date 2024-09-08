const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    secure: false,
    port: 587,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
});

module.exports = {
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;

            // Cari user berdasarkan email
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const newPassword = CryptoJS.lib.WordArray.random(12).toString(); // Panjang password 12 karakter
            const encryptedPassword = CryptoJS.AES.encrypt(
                newPassword,
                process.env.SECRET
            ).toString();
            user.password = encryptedPassword;
            await user.save();

            // Buat mailOptions untuk email
            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: 'Reset Password Request',
                html: `
            <div style="
              width: 100%; 
              background-color: #f4f4f4; 
              padding: 50px 0;
              font-family: Arial, sans-serif;
            ">
              <div style="
                background-color: #ffffff; 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 30px;
                border: 1px solid #dddddd;
                border-radius: 10px;
              ">
                <h2 style="text-align: center; color: #333;">Reset Your Password</h2>
                <p style="font-size: 16px; color: #555;">
                  You requested to reset your password. Your new password is provided below. Please change it after logging in:
                </p>
                <div style="
                  padding: 20px;
                  background-color: #f9f9f9;
                  border: 1px solid #dddddd;
                  text-align: center;
                  margin: 20px 0;
                  font-size: 18px;
                  color: #333;
                ">
                  <strong>Your new password: ${newPassword}</strong>
                </div>
                <p style="font-size: 16px; color: #555;">
                  If you didn't request a password reset, please ignore this email or contact support.
                </p>
                <p style="text-align: center; color: #999; font-size: 14px;">
                  &copy; 2024 Awriyou(Foodplanner). All rights reserved.
                </p>
              </div>
            </div>
          `,
            };

            // Kirim email dengan password baru
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res
                        .status(500)
                        .json({ message: 'Error sending email' });
                }
                res.status(200).json({
                    message:
                        'Password reset successfully. Check your email for the new password.',
                });
            });
        } catch (error) {
            res.status(500).json({ message: 'An error occurred', error });
        }
    },

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

            const { password, __v, createdAt, updateAt, ...userData } =
                user._doc;

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
    changePassword: async (req, res) => {
        try {
            const userId = req.params.id;
            const { oldPassword, newPassword } = req.body;

            // Temukan pengguna berdasarkan ID
            const user = await User.findById(userId);
            if (!user)
                return res.status(404).json({ message: 'User not found' });

            // Verifikasi kata sandi lama
            const decryptedOldPassword = CryptoJS.AES.decrypt(
                user.password,
                process.env.SECRET
            ).toString(CryptoJS.enc.Utf8);

            if (decryptedOldPassword !== oldPassword) {
                return res
                    .status(400)
                    .json({ message: 'Incorrect old password' });
            }

            // Enkripsi kata sandi baru
            const encryptedNewPassword = CryptoJS.AES.encrypt(
                newPassword,
                process.env.SECRET
            ).toString();

            // Perbarui kata sandi pengguna
            user.password = encryptedNewPassword;
            await user.save();

            res.status(200).json({ message: 'Password updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    getUser: async (req, res) => {
        try {
            const userId = req.params.id;

            const user = await User.findById(userId).populate(
                'favorites planner.recipes'
            );
            if (!user)
                return res.status(404).json({ message: 'User not found' });

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
            if (!user)
                return res.status(404).json({ message: 'User not found' });

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
            if (!user)
                return res.status(404).json({ message: 'User not found' });

            if (user.favorites.includes(recipeId)) {
                return res
                    .status(400)
                    .json({ message: 'Recipe already in favorites' });
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
            if (!user)
                return res.status(404).json({ message: 'User not found' });

            if (!user.favorites.includes(recipeId)) {
                return res
                    .status(400)
                    .json({ message: 'Recipe not in favorites' });
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
                path: 'planner.recipes',
                model: 'Recipe', // Pastikan 'Recipe' sesuai dengan nama model resep Anda
            });

            if (!user)
                return res.status(404).json({ message: 'User not found' });

            // Format planner data untuk frontend
            const formattedPlanner = user.planner.map((planner) => ({
                id: planner._id,
                date: planner.date,
                time: planner.time,
                recipes: planner.recipes.map((recipe) => ({
                    id: recipe._id,
                    name: recipe.name,
                    description: recipe.description,
                    ingredients: recipe.ingredients,
                    steps: recipe.steps,
                    recipe_img: recipe.recipe_img,
                    id_cat: recipe.id_cat,
                    level: recipe.level,
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
            const { date, time, recipeId } = req.body;

            const user = await User.findById(userId).populate(
                'planner.recipes'
            );
            if (!user)
                return res.status(404).json({ message: 'User not found' });

            // Mengubah date menjadi Date object
            const dateObj = new Date(date);

            // Mengecek apakah sudah ada planner dengan tanggal dan waktu yang sama
            let planner = user.planner.find(
                (planner) =>
                    planner.date.getTime() === dateObj.getTime() &&
                    planner.time === time
            );

            if (planner) {
                // Jika planner dengan tanggal dan waktu yang sama ditemukan, tambahkan resep baru
                if (
                    !planner.recipes.some((recipe) => recipe.equals(recipeId))
                ) {
                    planner.recipes.push(recipeId);
                } else {
                    return res.status(400).json({
                        message:
                            'Recipe already in planner for this date and time',
                    });
                }
            } else {
                // Jika planner dengan tanggal dan waktu tersebut belum ada, buat entri baru
                user.planner.push({ date: dateObj, time, recipes: [recipeId] });
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
            if (!user)
                return res.status(404).json({ message: 'User not found' });

            // Mencari planner dengan plannerId yang sesuai
            let planner = user.planner.id(plannerId);
            if (!planner) {
                return res.status(400).json({ message: 'Planner not found' });
            }

            // Menghapus resep dari planner
            planner.recipes.pull(recipeId);

            // Menghapus planner jika tidak ada resep yang tersisa
            if (planner.recipes.length === 0) {
                // Menggunakan splice untuk menghapus planner dari user.planner array
                user.planner = user.planner.filter(
                    (p) => p.id.toString() !== plannerId
                );
            }

            await user.save();

            res.status(200).json({ message: 'Recipe removed from planner' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
};
