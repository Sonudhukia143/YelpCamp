import {Campground } from '../models/campground.mjs';

async function ifAuth(req,res,next){
    const author = req.user;
    const campground = await Campground.findById(req.params.id);
    if(!author.equals(campground.author._id)){
        req.flash('error','You Are Not Validated for this action');
        res.redirect(`/campgrounds/${campground._id}`);
    }else{
        next();
    }
}

export { ifAuth }
