import {Campground,forValidation } from '../models/campground.mjs';
import cloudinary from 'cloudinary';
import fetch from 'node-fetch'; 

import dotenv from 'dotenv';

if( process.env.NODE_ENV !== "production" ) {
    dotenv.config();
}

export default class CampgroundController {

allCampgrounds = async function (req, res) {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index.ejs', { campgrounds });
};

addCampgroundGet = async (req, res) => {
    try {
        res.render('campgrounds/new');
    } catch (err) {
        console.log("500 INTERNAL SERVER ERROR", err);
    }
};

addCampgroundPost = async (req, res) => {
    try{
        const { error } = forValidation(req.body.campground);
        if(error) {
            req.flash('error','Enter Valid Data In Your Form ');
            return res.redirect('campgrounds/new');
        }

        const campground = new Campground(req.body.campground);

        const response = await fetch(`https://api.geoapify.com/v1/geocode/search?postcode=${campground.postcode}&city=${campground.city}&state=${campground.state}&country=${campground.country}&format=json&apiKey=${process.env.geolocation_API_key}`);

        const data = await response.json();  

        campground.images = await req.files.map(f => ({url: f.path,filename:f.filename }));

        campground.author = await req.user;
        campground.geometry.coordinates[0] = await data.results[0].lat;
        campground.geometry.coordinates[1] = await data.results[0].lon;

        campground.geometry.type = "Point";
        campground.type = "Feature";

        campground.properties = { 
            iconSize: 0.55,
            htmlPopup: `<a href="campgrounds/${campground._id}">${campground.title}</a>`
        };

        await campground.save();
        req.flash('success','Succesfully Created a Campground ');

        return res.redirect(`/campgrounds/${campground._id}`);
    }catch(ex){
        console.log("ERROR IN POSTING CAMPGROUND",ex);
    }
};

showCampgroundGet = async (req, res,) => {
    const campground = await Campground.findById(req.params.id).populate({
        path:'review',
        populate: {
            path:'author'
        }
    }).populate('author');
    
    res.render('campgrounds/show.ejs', { campground:campground });
};

editCampgroundGet = async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const author = req.user;
    
    res.render('campgrounds/edit.ejs', { campground,author });
};

editCampgroundPut = async (req, res) => {
    const{error} = forValidation(req.body.campground);
    if(error) return res.redirect(`${req.params.id}/edit`);

    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });

    campground.images.push(...req.files.map(f => ({url: f.path,filename:f.filename })));
    await campground.save();

    if(req.body.deleteImages){
        for(let filename of req.body.deleteImages){
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull:{images:{filename:{$in:req.body.deleteImages}}}});
    }

    req.flash('success','Succesfully Updated a Campground');
    res.redirect(`/campgrounds/${campground._id}`);
};

deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success','Succesfully Deleted a Campground ');

    res.redirect('/campgrounds');
};

}