import mongoose, { mongo } from "mongoose";
import joi from 'joi';
import { Review } from "./review.mjs";

const Joi = joi;

const ImageSchema = new mongoose.Schema ({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function() {
    return this.url.replace('/upload','/upload/w_200');
});

const campgroundSchema = new mongoose.Schema({
    title: String,
    images:[ImageSchema],
    price: Number,
    description: String,
    postcode:String,
    city:String,
    state:String,
    country:String,
    geolocation:{
        lat:Number,
        lon:Number
    },
    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    review:[
     {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
     }
    ]
});

campgroundSchema.post('findOneAndDelete', async function (data) {
    if(data.review.length) {
        const res = await Review.deleteMany({ _id:{ $in: data.review }});
    }
});

const Campground = new mongoose.model('Campground', campgroundSchema);

function forValidation(campground) {
    const schema = {
        title: Joi.string().required(),
        price: Joi.number().min(0).required(),
        description: Joi.string().required(),
        postcode: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        country: Joi.string().required(),
        deleteImages: Joi.array()
    };
    return Joi.object(schema).validate(campground);
}

export{Campground , forValidation};