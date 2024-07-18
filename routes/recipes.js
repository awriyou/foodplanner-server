const router = require('express').Router();
const recipeControllers = require('../controllers/recipesControllers')


router.get('/', recipeControllers.getAllRecipe);
router.get('/:id', recipeControllers.getRecipe);
router.get('/search/:key', recipeControllers.searchRecipe);
router.post('/', recipeControllers.createRecipe);
router.post('/many/', recipeControllers.createRecipes);
router.get('/categories/:categoryId', recipeControllers.getRecipeByCategory);
router.get('/popular/recipes', recipeControllers.getPopularRecipes);
router.get(
  '/favoriteCount/:recipeId',
  recipeControllers.getRecipeFavoriteCounts
);

module.exports = router;