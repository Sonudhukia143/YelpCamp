async function userAuthentication(req,res,next) {
    try{
        if(!req.isAuthenticated()) {
            await req.flash('error','You Are Not Logged In');
            req.session.returnTo = req.originalUrl;
            return res.redirect('/campgrounds/login');
        } next();
    }catch(err) {
        console.log(err);
    }
}

async function storeReturnTo(req, res, next){
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
}

export { userAuthentication,storeReturnTo}

