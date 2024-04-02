function error(err,req,res,next){
    console.log(err);
    return res.send("Couldnot Find The Page That You Are Requesting For");
}

export { error };