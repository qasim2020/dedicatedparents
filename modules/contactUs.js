import all_modules from './all_modules.js';

const contactUs = async function(req,res) {
    return {
        gallery: await all_modules.gallery(req,res),
        futureEvents: await all_modules.futureEvents(req,res),
        footerBlogs: await all_modules.footerBlogs(req, res),
        meta: {
            img: "https://res.cloudinary.com/miscellaneous/image/upload/v1728680792/dedicatedparents/meta-image.png"
        }
    }
};

export default contactUs;