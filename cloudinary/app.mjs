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
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder:'YelpCamp',
        allowedFormat: ['jpg','jpeg','png']
    }
});

export { cloudinary,storage };