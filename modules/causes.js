import all_modules from './all_modules.js';

const causes = async function(req,res) { 
    return {
        causes: await all_modules.causes(req,res), 
        futureEvents: await all_modules.futureEvents(req,res), 
        gallery: await all_modules.gallery(req,res),
        footerBlogs: await all_modules.footerBlogs(req, res),
        meta: {
            img: "https://res.cloudinary.com/miscellaneous/image/upload/v1728680792/dedicatedparents/meta-image.png"
        }
    }
};

export default causes;
