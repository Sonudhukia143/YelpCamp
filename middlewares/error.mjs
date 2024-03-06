function error(err,req,res,next){
    res.send("Couldnot Find The Page That You Are Requesting For");
    console.log(err);
}

export { error };