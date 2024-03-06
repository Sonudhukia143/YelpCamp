import mongoose from "mongoose";
import joi from 'joi';

const Joi = joi;

const campgroundSchema = new mongoose.Schema({
    title: String,
    image: String,
    price: Number,
    description: String,
    location: String
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

export{Campground , forValidation };