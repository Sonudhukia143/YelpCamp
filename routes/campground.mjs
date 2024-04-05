import { ForEachRoute } from '../middlewares/forEachRoute.mjs';
import express from 'express';

import {User} from '../models/user.mjs';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import { userAuthentication,storeReturnTo } from '../middlewares/userAuthentication.mjs';
import { ifAuth } from '../middlewares/ifAuth.mjs';

const app = express();

const router = express.Router();

/******************* USER SECTION *************USER SECTION**********USER SECTION***********************/
/******************* USER SECTION *************USER SECTION**********USER SECTION**********************/
//PASSPORT JS AUTHENTICATION SETUP
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

import UserController from '../controler/user.mjs';

const userController = new UserController();

//ROUTES HERE
router.get('/register', ForEachRoute(userController.registerUserGet));

router.post('/register',ForEachRoute(userController.registerUserPost));

router.get('/login', ForEachRoute(userController.loginUserGet));

router.post('/login',storeReturnTo, passport.authenticate('local', { failureRedirect:'/campgrounds/login',failureFlash: true  }) , ForEachRoute(userController.loginUserPost));

router.get('/logout',ForEachRoute(ForEachRoute(userController.logOutUser)));
/***UPTO HERE****UPTO HERE*************UPTO HERE*********UPTO HERE*********** UPTO HERE */
/******UPTO HERE********* UPTO HERE *****************UPTO HERE***********UPTO HERE****************/

import CampgroundController from '../controler/campgrounds.mjs';

import multer from 'multer';
const upload = multer({ storage:storage });
import { cloudinary,storage} from '../cloudinary/app.js'

const campgroundController = new CampgroundController();

router.get('/',ForEachRoute(campgroundController.allCampgrounds));

router.get('/new',userAuthentication ,ForEachRoute(campgroundController.addCampgroundGet));

router.post('/', userAuthentication , upload.array('images[]') ,ForEachRoute(campgroundController.addCampgroundPost));

router.get('/:id' ,ForEachRoute(campgroundController.showCampgroundGet));

router.get('/:id/edit',userAuthentication ,ForEachRoute(campgroundController.editCampgroundGet));

router.put('/:id',userAuthentication, ifAuth, upload.array('images[]') ,ForEachRoute(campgroundController.editCampgroundPut));

router.delete('/:id',userAuthentication ,ifAuth,ForEachRoute(campgroundController.deleteCampground));

export { router};