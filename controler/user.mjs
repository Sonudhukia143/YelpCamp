import { User } from "../models/user.mjs";

export default class UserController {
    registerUserGet = (req,res) => {
        res.render('users/register.ejs');
    };
    registerUserPost =  async(req,res,next) => {
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
    };

    loginUserGet = (req,res) => {
        res.render('users/login.ejs');
    };
    loginUserPost  = (req, res, next) => {
        req.session.save((err) => {
            if (err) {
              next(err);
            }
            req.flash('success','Welcome Back!');
    
            const redirectUrl = res.locals.returnTo || '/campgrounds'; 
            
            res.redirect(redirectUrl);
        });
    };

    logOutUser = async (req,res,next) => {
        try{
            await req.session.destroy();
    
            res.redirect('/campgrounds');
        }catch(err){
            next(err);
        }
    }

}