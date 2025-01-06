const express = require('express');
const axios = require('axios');
const db = require("../db");
const router = express.Router();
const {checkAuthenticated, checkNotAuthenticated} = require('../utils/middleware');

router.get('/books', async (req, res) => {
    const books = await db.query("SELECT * FROM book");
    res.render('admin/books/index', {books: books.rows});
})

router.get('/books/new', (req, res) => {
    res.render('admin/books/new');
})

router.get('/books/:id/edit', async (req, res) => {
    const book = await db.query("SELECT * FROM book WHERE id = $1", [req.params.id]);
    res.render('admin/books/edit', { book: book.rows[0]});
})

router.put('/books/:id', async (req, res) => {
    const {title, author, genre, isbn, publisher, year, quantity, price} = req.body;
    await db.query("UPDATE book SET title = $1, author = $2, genre = $3, isbn = $4, publisher = $5, year = $6, quantity = $7, price = $8 WHERE id = $9",
        [title, author, genre, isbn, publisher, year, quantity, price, req.params.id]);
    res.redirect("/admin/books/");
})

router.post('/books', checkAuthenticated, async(req, res) => {
    // try {
        const {title, author, genre, isbn, publisher, year, quantity, price} = req.body;
        const cover = await axios.get(`https://bookcover.longitood.com/bookcover/${isbn}`);
        await db.query('INSERT INTO book (title, author, genre, isbn, publisher, year, quantity, price, cover) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [title, author, genre, isbn, publisher, year, quantity, price, cover.data.url]);
        res.redirect('/admin/books');
    // } catch {
    //     res.redirect('/admin/books');
    // }
})

module.exports = router;