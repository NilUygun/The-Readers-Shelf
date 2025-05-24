const express = require('express');
const db = require("../db");
const router = express.Router();
const {checkAuthenticated, checkNotAuthenticated} = require('../utils/middleware');

router.get('/books', async (req, res) => {
    const books = await db.query("SELECT * FROM book");
    const user = req.user;
    res.render('customer/books', {books: books.rows});
})

router.get('/books/:id/', async (req, res) => {
    const book = await db.query("SELECT * FROM book WHERE id = $1", [req.params.id]);
    res.render('customer/books/show', { book: book.rows[0]});
})

router.post('/cart/:book_id', checkAuthenticated, async (req, res) => {
    const book = await db.query("SELECT quantity FROM book WHERE id = $1", [req.params.book_id]);
    const in_stock = book.rows[0].quantity;
    const cart_item = await db.query("SELECT id, quantity FROM cart_item WHERE book_id = $1 AND customer_id = $2", [req.params.book_id, req.user.id]);
    const in_cart = cart_item.rows.length !== 0 ? cart_item.rows[0].quantity : 0;
    if (in_cart + 1 > in_stock){
        const all_books = await db.query("SELECT * FROM book");
        res.redirect("/customer/books", {books: all_books.rows});
    }
    if (in_cart === 0){
        await db.query("INSERT INTO cart_item (customer_id, book_id, quantity) values ($1, $2, $3)", [req.user.id, req.params.book_id, 1]);
    } else {
        await db.query("UPDATE cart_item SET quantity = $1 WHERE id = $2", [in_cart + 1, cart_item.rows[0].id]);
    }
    res.redirect("/customer/cart");
})

router.delete('/cart/:book_id', checkAuthenticated, async (req, res) => {
    const cart_item = await db.query("SELECT id, quantity FROM cart_item WHERE book_id = $1 AND customer_id = $2", [req.params.book_id, req.user.id]);
    const in_cart = cart_item.rows.length !== 0 ? cart_item.rows[0].quantity : 0;
    if (in_cart === 0){
        const all_books = await db.query("SELECT * FROM book");
        res.redirect("/customer/books", {books: all_books.rows});
    }
    if (in_cart === 1){
        await db.query("DELETE FROM cart_item WHERE book_id = $1 AND customer_id = $2", [req.params.book_id, req.user.id]);
    } else {
        await db.query("UPDATE cart_item SET quantity = $1 WHERE id = $2", [in_cart - 1, cart_item.rows[0].id]);
    }
    res.redirect("/customer/cart");
})

router.get('/cart', checkAuthenticated, async (req, res) => {
    const books = await db.query("SELECT c.*, b.*, c.quantity AS cart_quantity, b.quantity AS stock_quantity FROM cart_item AS c JOIN Book AS b ON c.book_id = b.id WHERE c.customer_id = $1;", [req.user.id]);
    res.render('customer/cart', {books: books.rows});
})

module.exports = router;