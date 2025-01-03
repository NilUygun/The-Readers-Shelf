if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const {Pool} = require('pg');
const pool = new Pool({
    host: 'localhost',
    database: 'TheReadersShelf',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD,
})

module.exports = pool