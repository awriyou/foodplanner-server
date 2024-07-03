const router = require('express').Router();
const recipeControllers = require('../controllers/recipesControllers')


router.get('/', recipeControllers.getAllRecipe);
router.get('/:id', recipeControllers.getRecipe);
router.get('/search/:key', recipeControllers.searchRecipe);
router.post('/', recipeControllers.createRecipe);

module.exports = router;