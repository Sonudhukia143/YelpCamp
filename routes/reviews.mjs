import express from 'express';
import { ForEachRoute } from '../middlewares/forEachRoute.mjs';
import { isReviewAuthor } from '../middlewares/isReviewAuthor.mjs';

import {User} from '../models/user.mjs';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import { userAuthentication } from '../middlewares/userAuthentication.mjs';
import ReviewController from '../controler/review.mjs';

const app = express();

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const router = express.Router({ mergeParams:true});
const reviewController = new ReviewController();

router.post('/',userAuthentication,ForEachRoute (reviewController.reviewPost));

router.delete('/:reviewId', userAuthentication, isReviewAuthor ,ForEachRoute(reviewController.deleteReview));

export { router};