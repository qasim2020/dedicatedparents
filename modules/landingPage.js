import all_modules from './all_modules.js';

const landingPage = async function(req, res) {
    req.params.module = req.query.lang || "en";
    let output = {
        events: await all_modules.pastThreeEvents(req,res),
        futureThreeEvents: await all_modules.futureThreeEvents(req,res),
        futureEvents: await all_modules.futureEvents(req,res),
        staffs: await all_modules.staffs(req,res), 
        causes: await all_modules.causes(req,res),
        gallery: await all_modules.gallery(req,res), 
        threePages: await all_modules.threePages(req,res),
        footerBlogs: await all_modules.footerBlogs(req, res),
        twoBlogs: await all_modules.twoBlogs(req,res),
        meta: {
            img: "https://res.cloudinary.com/miscellaneous/image/upload/v1728680792/dedicatedparents/meta-image.png"
        }
    };
    return output;
}; 

export default landingPage;