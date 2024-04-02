function ForEachRoute(handler){
    return async function (req,res,next){
        try{
            await handler(req,res,next);
        }catch(ex){
            next(ex);
        }
    }
}

export {ForEachRoute};