import { Review } from "../models/review.mjs";

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

export { isReviewAuthor}