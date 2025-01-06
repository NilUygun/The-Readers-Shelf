const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const db = require('./db');
const adminRoutes = require('./routes/admin');
const customerRoutes = require('./routes/customer');
const {checkAuthenticated, checkNotAuthenticated} = require('./utils/middleware');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const initializePassport = require('./passport-config');
const book = require("pg/lib/query");
initializePassport(passport);

app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: false}))
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use("/admin", adminRoutes);
app.use("/customer", customerRoutes);
app.use(express.static('public'));

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login');
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/admin/books',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register');
})

app.post('/register', checkNotAuthenticated, async(req, res) => {
    try {
        const hashedPassword = await bcrypt.hashSync(req.body.password, 10);
        const {username, email} = req.body;
        await db.query('INSERT INTO customer (username, email, password) values ($1, $2, $3)', [username, email, hashedPassword]);
        res.redirect('/login');
    } catch {
        res.redirect('/register');
    }
})

app.post('/logout', checkAuthenticated, (req, res) => {
    req.logout();
    res.redirect('/login');
})

app.listen(3000);