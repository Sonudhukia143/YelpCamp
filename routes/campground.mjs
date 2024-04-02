import {Campground,forValidation } from '../models/campground.mjs';
import { ForEachRoute } from '../middlewares/forEachRoute.mjs';
import express from 'express';

import {User} from '../models/user.mjs';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import { userAuthentication,storeReturnTo } from '../middlewares/userAuthentication.mjs';

const app = express();

const router = express.Router();

/******************* USER SECTION *************USER SECTION**********USER SECTION***********************/
/******************* USER SECTION *************USER SECTION**********USER SECTION**********************/

//PASSPORT JS AUTHENTICATION SETUP
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//ROUTES HERE
router.get('/register', ForEachRoute((req,res) => {
    res.render('users/register.ejs');
}));

router.post('/register',ForEachRoute( async(req,res,next) => {
    try{
        const { username , gmail , password} = req.body;
        const user = new User({ username,gmail });
        const registeredUser = await User.register(user,password);

        req.login(registeredUser, (err) => {
            if (err)  return next(err); 

            req.flash('success','Welcome To YelpCamp');
            return res.redirect('/campgrounds');
        });

    }catch(err){
        req.flash('error','Username or Gmail Already In Existence');
        return res.redirect('/campgrounds/register');
    }
}));

router.get('/login', (req,res) => {
    res.render('users/login.ejs');
});

router.post('/login',storeReturnTo, passport.authenticate('local', { failureRedirect:'/campgrounds/login',failureFlash: true  }) , (req, res, next) => {
    req.session.save((err) => {
        if (err) {
          next(err);
        }
        req.flash('success','Welcome Back!');

        const redirectUrl = res.locals.returnTo || '/campgrounds'; 
        
        res.redirect(redirectUrl);
    });
});

router.get('/logout',ForEachRoute(async (req,res,next) => {
    try{
        await req.session.destroy();

        res.redirect('/campgrounds');
    }catch(err){
        next(err);
    }
}));

/***UPTO HERE****UPTO HERE*************UPTO HERE*********UPTO HERE*********** UPTO HERE */
/******UPTO HERE********* UPTO HERE *****************UPTO HERE***********UPTO HERE****************/

router.get('/',ForEachRoute(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index.ejs', { campgrounds });
}));

router.get('/new',userAuthentication ,ForEachRoute(async (req, res) => {
    try{
        res.render('campgrounds/new');
    }catch(err){
        console.log("500 INTERNAL SERVER ERROR",err);
    }
}));

router.post('/', userAuthentication ,ForEachRoute(async (req, res) => {
    try{
        const{error} = forValidation(req.body.campground);
        if(error) {
            req.flash('error','Enter Valid Data In Your Form ');
            res.redirect('campgrounds/new');
        }

        const campground = new Campground(req.body.campground);
        campground.author = req.user;

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
        path:'review',
        populate: {
            path:'author'
        }
    }).populate('author');

    res.render('campgrounds/show.ejs', { campground});
}));

router.get('/:id/edit',userAuthentication ,ForEachRoute(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const author = req.user;
    
    res.render('campgrounds/edit.ejs', { campground,author });
}));

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

router.put('/:id',userAuthentication, ifAuth ,ForEachRoute(async (req, res) => {
    const{error} = forValidation(req.body.campground);
    if(error) return res.redirect(`${req.params.id}/edit`);

    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    req.flash('success','Succesfully Updated a Campground');
    
    res.redirect(`/campgrounds/${campground._id}`);
}));

router.delete('/:id',userAuthentication ,ifAuth,ForEachRoute(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success','Succesfully Deleted a Campground ');

    res.redirect('/campgrounds');
}));

export { router};