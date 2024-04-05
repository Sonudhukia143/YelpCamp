import dotenv from 'dotenv';
if( process.env.NODE_ENV !== "production" ) {
    dotenv.config();
}

import express from 'express';
import path from 'path';
import { dirname } from 'path';
import mongoose from 'mongoose';
import methodOverride from 'method-override';
import { fileURLToPath } from 'url';
import { error } from './middlewares/error.mjs';

import flash from 'connect-flash';
import { ForEachRoute } from './middlewares/forEachRoute.mjs';
import expressSession from 'express-session';
import passport from 'passport';

import { router as campgroundRouter } from './routes/campground.mjs';
import { router as reviewRouter } from './routes/reviews.mjs';

mongoose.connect('mongodb://localhost:27017/yelp-camp')
.then(() => {
    console.log("Connected to the database");
})
.catch((err) => {
    console.log("Error In Establishing Connection",err);
});

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use('/public', express.static(path.join(__dirname, 'public')));

const sessionConfig = expressSession({
  secret: 'this is Secret key',
  cookie:{  httpOnly:true },
  resave: false,
  saveUninitialized: true
});
app.use(sessionConfig);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use((req,res,next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});


app.use('/campgrounds/:id/reviews',reviewRouter);
app.use('/campgrounds',campgroundRouter);

app.get('/',ForEachRoute(async (req,res) => {
    res.send("Welcome To YelpCamp Homepage");
}));


app.use('*', ForEachRoute((req,res) => {
    res.status(404).send("Route Not Found");
}));

app.use(error);

const Port = { port:process.env.PORT||3000 };

app.listen(Port.port, () => {
    console.log(`Serving on port ${Port.port}`);
});