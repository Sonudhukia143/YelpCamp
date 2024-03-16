import express from 'express';
import { ForEachRoute } from '../middlewares/forEachRoute.mjs';
import { Review, forValidationReview } from '../models/review.mjs';
import {Campground,forValidation } from '../models/campground.mjs';

const router = express.Router({ mergeParams:true});

router.post('/',ForEachRoute ( async (req ,res) => {
    try{
        const { id } = req.params;
        const campground = await Campground.findById(id);
    
        const review = new Review(req.body); 
          
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

router.delete('/:reviewId', ForEachRoute(async(req,res) => {
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