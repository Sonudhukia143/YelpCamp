import { Review } from "../models/review.mjs";
import { Campground } from "../models/campground.mjs";

export default class ReviewController {
    reviewPost =  async (req ,res) => {
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
    };
    deleteReview = async(req,res) => {
        try{
            const id = req.params.id;
            const review = await Review.findByIdAndDelete(req.params.reviewId);
            if(!review) return console.log('ERROR FOUND');
    
            req.flash('success','Succesfully Deleted a Review');
    
            res.redirect(`/campgrounds/${id}`);
        }catch(err){
            console.log('error in deleting the review section',err);
        }
    }
}