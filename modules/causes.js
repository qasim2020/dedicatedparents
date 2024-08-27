import all_modules from './all_modules.js';

const causes = async function(req,res) { 
    return {
        causes: await all_modules.causes(req,res), 
        futureEvents: await all_modules.futureEvents(req,res), 
        gallery: await all_modules.gallery(req,res),
        footerBlogs: await all_modules.footerBlogs(req, res)
    }
};

export default causes;
