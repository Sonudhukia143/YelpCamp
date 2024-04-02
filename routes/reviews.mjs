import express from 'express';
import { ForEachRoute } from '../middlewares/forEachRoute.mjs';
import { Review, forValidationReview } from '../models/review.mjs';
import {Campground,forValidation } from '../models/campground.mjs';

import {User} from '../models/user.mjs';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import { userAuthentication } from '../middlewares/userAuthentication.mjs';

const app = express();

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const router = express.Router({ mergeParams:true});

router.post('/',userAuthentication,ForEachRoute ( async (req ,res) => {
    try{
        const { id } = req.params;
        const campground = await Campground.findById(id);
    
        const review = new Review(req.body); 

        review.author = req.user;
          
        /*const{error} = forValidationReview(review);
        if(error) return console.log("ERROR IN VALIDATION OF REVIEW",error);*/
    
        await review.save();
    
        campground.review.push(review);
        await campground.save();

        req.flash('success','Succesfully Created a Review');
    
        res.redirect(`/campgrounds/${id}`);
    }catch(err){
        console.log("OOPS ERROR",err);
    }
}));

async function isReviewAuthor (req,res,next) {
    const id = req.params.id;
    
    const review = await Review.findById(req.params.reviewId);

    const author = req.user;
 
    if(!author.equals(review.author)){
        req.flash('error','You Are Not Validated for this action');
        res.redirect(`/campgrounds/${id}`);
    }else{
        next();
    }
}

router.delete('/:reviewId', userAuthentication, isReviewAuthor ,ForEachRoute(async(req,res) => {
    try{
        const id = req.params.id;
        const review = await Review.findByIdAndDelete(req.params.reviewId);
        if(!review) return console.log('ERROR FOUND');

        req.flash('success','Succesfully Deleted a Review');

        res.redirect(`/campgrounds/${id}`);
    }catch(err){
        console.log('error in deleting the review section',err);
    }
}));

export { router};