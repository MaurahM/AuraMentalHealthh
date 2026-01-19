const express = require('express');
const router = express.Router();

const { stkPush, mpesaCallback } = require('../controllers/mpesaController');

router.post('/stk-push', stkPush);
router.post('/callback', mpesaCallback);

module.exports = router;
