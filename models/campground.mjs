import mongoose, { mongo } from "mongoose";
import joi from 'joi';
import { Review } from "./review.mjs";

const Joi = joi;

const campgroundSchema = new mongoose.Schema({
    title: String,
    image:String,
    price: Number,
    description: String,
    location: String,
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
        title : Joi.string().required(),
        image: Joi.string().required(),
        price: Joi.number().min(0).required(),
        description: Joi.string().required(),
        location: Joi.string().required()
    };
    return Joi.object(schema).validate(campground);
}

export{Campground , forValidation};