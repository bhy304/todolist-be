const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateJoin, validateLogin } = require('../middleware/validators');


router.post('/join', validateJoin, authController.join);
router.post('/login', validateLogin, authController.login);

module.exports = router;
