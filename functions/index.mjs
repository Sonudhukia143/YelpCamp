import mongoose from 'mongoose';
import serverless from 'serverless-http';

import dotenv from 'dotenv';
if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

async function connectToDb() {
    try {
        await mongoose.connect(process.env.mongo_atlas_key)
            .then(() => {
                console.log("Connected to the database");
            })
            .catch((err) => {
                console.log("Error In Establishing Connection", err);
            })
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}

import express from 'express';

import mongoSanitize from 'express-mongo-sanitize';

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());


import path from 'path';
import { dirname } from 'path';
import methodOverride from 'method-override';
import { fileURLToPath } from 'url';
import { error } from '../middlewares/error.mjs';

import flash from 'connect-flash';
import { ForEachRoute } from '../middlewares/forEachRoute.mjs';
import expressSession from 'express-session';
import passport from 'passport';

import { router as campgroundRouter } from '../routes/campground.mjs';
import { router as reviewRouter } from '../routes/reviews.mjs';

import MongoStore from 'connect-mongo'


/*
mongoose.connect('mongodb://localhost:27017/yelp-camp')
.then(() => {
    console.log("Connected to the database");
})
.catch((err) => {
    console.log("Error In Establishing Connection",err);
});
*/

fileURLToPath(import.meta.url);
const __filename = __filename;
const __dirname = path.dirname(__filename);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(methodOverride('_method'));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/campgroundimages', express.static(path.join(__dirname, 'campgroundimages')));

const store = MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/yelp-camp',
    ttl: 24 * 60 * 60, // = 1 day
    touchAfter: 24 * 60 * 60
});


const sessionConfig = expressSession({
    store: store,
    secret: 'this is Secret key',
    cookie: { httpOnly: true },
    resave: false,
    saveUninitialized: true
});
app.use(sessionConfig);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.use('/campgrounds/:id/reviews', reviewRouter);
app.use('/campgrounds', campgroundRouter);

app.get('/', ForEachRoute(async (req, res) => {
    res.render("home.ejs");
}));


app.use('*', ForEachRoute((req, res) => {
    res.status(404).render("/error/error.ejs");
}));

app.use(error);

const Port = { port: process.env.PORT || 3000 };

app.listen(Port.port, () => {
    console.log(`Serving on port ${Port.port}`);
});

export const handler = serverless(app);