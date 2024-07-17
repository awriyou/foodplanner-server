const router = require('express').Router();
const userControllers = require('../controllers/usersControllers');

router.post('/login', userControllers.login);
router.post('/register', userControllers.register);
router.put('/changePassword/:id', userControllers.changePassword);
router.get('/:id', userControllers.getUser);
router.get('/recipe/favoriteCount/:recipeId', userControllers.getRecipeFavoriteCounts);
router.get('/favorite/:id', userControllers.getFavorite);
router.post('/favorite', userControllers.addFavorite);
router.delete('/favorite/:id', userControllers.deleteFavorite);
router.get('/planner/:id', userControllers.getPlanner);
router.post('/planner', userControllers.addPlanner);
router.delete('/planner/:id', userControllers.deletePlanner);

module.exports = router;
