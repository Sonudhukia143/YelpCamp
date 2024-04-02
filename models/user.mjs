import mongoose from 'mongoose';
import passportLocalMonoose from 'passport-local-mongoose';

const userSchema = new mongoose.Schema({
    gmail:{
        type:String,
        required:true,
        unique:true
    }
});

userSchema.plugin(passportLocalMonoose);

const User = mongoose.model('User',userSchema);

function forValidationUser(user) {
    const schema = {
        username : Joi.string().required(),
        gmail: Joi.string().required(),
        password: Joi.string().required(),
    };
    return Joi.object(schema).validate(user);
}

export {User, forValidationUser }