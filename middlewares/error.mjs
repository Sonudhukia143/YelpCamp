
function error(err,req,res,next){
    res.render('error/error.ejs');
}

export { error };