const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const db = require('./db');

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

app.get('/admin/books', async (req, res) => {
    const books = await db.query("SELECT * FROM book");
    res.render('admin/books/index', {books: books.rows});
})

app.get('/admin/books/new', (req, res) => {
    res.render('admin/books/new');
})

app.get('/admin/books/:id/edit', async (req, res) => {
    const book = await db.query("SELECT * FROM book WHERE id = $1", [req.params.id]);
    res.render('admin/books/edit', { book: book.rows[0]});
})

app.put('/admin/books/:id', async (req, res) => {
    const {title, author, genre, isbn, publisher, year, quantity, price} = req.body;
    await db.query("UPDATE book SET title = $1, author = $2, genre = $3, isbn = $4, publisher = $5, year = $6, quantity = $7, price = $8 WHERE id = $9",
        [title, author, genre, isbn, publisher, year, quantity, price, req.params.id]);
    res.redirect("/admin/books/");
})

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

app.post('/admin/books', checkAuthenticated, async(req, res) => {
    try {
        const {title, author, genre, isbn, publisher, year, quantity, price} = req.body;
        await db.query('INSERT INTO book (title, author, genre, isbn, publisher, year, quantity, price) values ($1, $2, $3, $4, $5, $6, $7, $8)', [title, author, genre, isbn, publisher, year, quantity, price]);
        res.redirect('/admin/books');
    } catch {
        res.redirect('/admin/books');
    }
})

app.post('/logout', checkAuthenticated, (req, res) => {
    req.logout();
    res.redirect('/login');
})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
}

app.listen(3000);