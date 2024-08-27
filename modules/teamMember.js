import all_modules from './all_modules.js';

const teamMember = async function(req,res) {
    return {
        staff: await all_modules.getStaff(req,res),
        gallery: await all_modules.gallery(req,res),
        futureEvents: await all_modules.futureEvents(req,res),
        footerBlogs: await all_modules.footerBlogs(req, res)
    }

};


export default teamMember;