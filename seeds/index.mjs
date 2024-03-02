import mongoose from 'mongoose';
import {cities} from './cities.mjs'
import { places, descriptors } from './seedHelper.mjs';
import Campground from '../models/campground.mjs';

mongoose.connect('mongodb://localhost:27017/yelp-camp',)
.then(() => {
    console.log("Conneceted to the Database");
})
.catch((err) =>{
    console.log("Error establishing connection",err);
});

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const camp = new Campground({
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})