
function error(err,req,res,next){
    console.log(err);
    res.render('error/error.ejs');
}

export { error };