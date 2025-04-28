const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Страница регистрации
router.get('/register', (req, res) => {
    res.render('register');
});

// Обработка регистрации
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = new User({ username, password });
        await user.save();
        res.redirect('/login');
    } catch (err) {
        res.status(400).send('Error during registration');
    }
});

// Страница входа
router.get('/login', (req, res) => {
    res.render('login');
});

// Обработка входа
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).send('User not found');

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).send('Invalid credentials');

        req.session.userId = user._id;
        res.redirect('/dashboard');
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Дашборд (защищенная страница)
router.get('/dashboard', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.render('dashboard', { username: req.session.username });
});

// Выход из системы
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Could not log out');
        res.redirect('/login');
    });
});

module.exports = router;