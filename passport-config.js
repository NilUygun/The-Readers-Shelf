const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const db = require("./db");

const getUserByEmail = async email => {
    const user = await db.query('SELECT * FROM customer WHERE email = $1', [email]);
    return user.rows[0];
}

const getUserById = async id => {
    const user = await db.query('SELECT * FROM customer WHERE id = $1', [id]);
    return user.rows[0];
}

function initializePassport(passport) {
    const authenticateUser = async (email, password, done) => {
        const user = await getUserByEmail(email);
        if (user == null) {
            return done(null, false, {message: "No user with this email"});
        }
        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user);
            } else {
                return done(null, false, {message: "Incorrect password"});
            }
        } catch(err) {
            return done(err);
        }

    }
    passport.use(new LocalStrategy({usernameField: "email"}, authenticateUser));
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
        return done(null, await getUserById(id));
    });
}

module.exports = initializePassport;