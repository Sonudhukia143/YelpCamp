function ForEachRoute(handler){
    return async function (req,res,next){
        try{
            await handler(req,res);
        }catch(ex){
            next(ex);
        }
    }
}

export {ForEachRoute};