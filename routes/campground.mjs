import {Campground,forValidation } from '../models/campground.mjs';
import { ForEachRoute } from '../middlewares/forEachRoute.mjs';
import express from 'express';

const app = express();

const router = express.Router();

router.get('/',ForEachRoute(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index.ejs', { campgrounds });
}));

router.get('/new',ForEachRoute(async (req, res) => {
    res.render('campgrounds/new');
}));

router.post('/',ForEachRoute(async (req, res) => {
    try{
        const{error} = forValidation(req.body.campground);
        if(error) {
            req.flash('error','Enter Valid Data In Your Form ');
            res.redirect('campgrounds/new');
        }

        const campground = new Campground(req.body.campground);

        await campground.save();
        req.flash('success','Succesfully Created a Campground ');

        res.redirect(`/campgrounds/${campground._id}`);
    }
    catch(ex){
        console.log("ERROR IN POSTING CAMPGROUND",ex);
    }
}));

router.get('/:id',ForEachRoute(async (req, res,) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'review',
        populate: {
            path:'review',
            path: 'rating'
        }
    });    
    res.render('campgrounds/show.ejs', { campground});
}));

router.get('/:id/edit',ForEachRoute(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render('campgrounds/edit.ejs', { campground });
}));

router.put('/:id',ForEachRoute(async (req, res) => {

    const{error} = forValidation(req.body.campground);
    if(error) return res.redirect(`${req.params.id}/edit`);

    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    req.flash('success','Succesfully Updated a Campground ');

    res.redirect(`/campgrounds/${campground._id}`);
}));

router.delete('/:id',ForEachRoute(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success','Succesfully Deleted a Campground ');

    res.redirect('/campgrounds');
}));

export { router};