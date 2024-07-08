// const mongoose = require('mongoose');

// const UserSchema = new mongoose.Schema(
//   {
//     username: {
//       type: String,
//       required: true,
//     },
//     password: {
//       type: String,
//       required: true,
//     },

//     id_fav: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Favorite',
//     },
//     id_plan: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Planner',
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model('User', UserSchema);

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    favorites: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Recipe',
    },
    planner: {
      type: {
        date: {
          type: String,
          required: true,
        },
        recipes: {
          type: [mongoose.Schema.Types.ObjectId],
          ref: 'Recipe',
        },
      },
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
