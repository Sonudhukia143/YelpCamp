import express from 'express';
import path from 'path';
import { dirname } from 'path';
import mongoose from 'mongoose';
import methodOverride from 'method-override';
import {Campground,forValidation } from './models/campground.mjs';
import { fileURLToPath } from 'url';
import { error } from './middlewares/error.mjs';
import { ForEachRoute } from './middlewares/forEachRoute.mjs';
import { Review, forValidationReview } from './models/review.mjs';

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

app.get('/',ForEachRoute(async (req,res) => {
    res.send("Welcome To YelpCamp Homepage");
}));

app.get('/campgrounds',ForEachRoute(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
}));

app.get('/campgrounds/new',ForEachRoute(async (req, res) => {
    res.render('campgrounds/new');
}));

app.post('/campgrounds',ForEachRoute(async (req, res) => {
    try{
        const{error} = forValidation(req.body.campground);
        if(error) return res.render('campgrounds/new');

        const campground = new Campground(req.body.campground);
        await campground.save();
        res.redirect(`/campgrounds/${campground._id}`);
    }
    catch(ex){
        console.log(ex);
    }
}));

app.get('/campgrounds/:id',ForEachRoute(async (req, res,) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'review',
        populate: {
            path:'review',
            path: 'rating'
        }
    });    
    res.render('campgrounds/show', { campground});
}));

app.get('/campgrounds/:id/edit',ForEachRoute(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render('campgrounds/edit', { campground });
}));

app.put('/campgrounds/:id',ForEachRoute(async (req, res) => {
    const{error} = forValidation(req.body.campground);
    if(error) return res.redirect(`${req.params.id}/edit`);

    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    res.redirect(`/campgrounds/${campground._id}`);
}));

app.delete('/campgrounds/:id',ForEachRoute(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
}));

app.post('/campgrounds/:id/reviews',ForEachRoute ( async (req ,res) => {
    try{
        const { id } = req.params;
        const campground = await Campground.findById(id);
    
        const review = new Review(req.body); 
          
        /*const{error} = forValidationReview(review);
        if(error) return console.log("ERROR IN VALIDATION OF REVIEW",error);*/
    
        await review.save();
    
        campground.review.push(review);
        await campground.save();
    
        res.redirect(`/campgrounds/${id}`);
    }catch(err){
        console.log("OOPS ERROR",err);
    }
}));

app.delete('/campgrounds/:id/reviews/:reviewId', ForEachRoute(async(req,res) => {
    try{
        const id = req.params.id;
        const review = await Review.findByIdAndDelete(req.params.reviewId);
        if(!review) return console.log('ERROR FOUND');

        res.redirect(`/campgrounds/${id}`);
    }catch(err){
        console.log('error in deleting the review section',err);
    }
}));

app.use('*', (req,res) => {
    res.status(404).send("Route Not Found");
});

app.use(error);

const Port = { port:process.env.PORT||3000 };

app.listen(Port.port, () => {
    console.log(`Serving on port ${Port.port}`);
});