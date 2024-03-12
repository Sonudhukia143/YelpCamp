import mongoose from 'mongoose';
import joi from 'joi';

const Joi = joi;

const reviewSchema = new mongoose.Schema({
    rating: Number,
    review: String
});

const Review = new mongoose.model('Review',reviewSchema);

function forValidationReview (review) {
    const schema = {
        rating : Joi.number().required(),
        review : Joi.string().required()
    };
    return Joi.object(schema).validate(review);
}

export { Review , forValidationReview};
