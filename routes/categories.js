const router = require('express').Router();
const categoryControllers = require('../controllers/categoriesControllers');

router.get('/', categoryControllers.getAllCategory);
router.get('/:id', categoryControllers.getCategory);
router.post('/', categoryControllers.createCategory);

module.exports = router;
