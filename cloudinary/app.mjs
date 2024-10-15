import { v2 as cloudinary} from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

import dotenv from 'dotenv';

if( process.env.NODE_ENV !== "production" ) {
    dotenv.config();
}

/*
cloudinary.uploader
.upload("my_image.jpg")
.then(result=>console.log(result));
*/

cloudinary.config({ 
    cloud_name: process.env.cloudinary_cloud_name, 
    api_key: process.env.cloudinary_API_key, 
    api_secret: process.env.cloudinary_API_secret
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder:'YelpCamp',
        allowedFormat: ['jpg','jpeg','png']
    }
});

export { cloudinary,storage };