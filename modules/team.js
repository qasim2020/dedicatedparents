import all_modules from './all_modules.js';

const team = async function(req,res) {
    req.params.module = "staff";
    return {
        staffs: await all_modules.staffs(req,res),
        gallery: await all_modules.gallery(req,res),
        futureEvents: await all_modules.futureEvents(req,res),
        footerBlogs: await all_modules.footerBlogs(req, res)
    }
};

export default team;