import all_modules from './all_modules.js';

const causeSingle = async function(req,res) {
    return {
        cause: await all_modules.getCause(req,res),
        gallery: await all_modules.gallery(req,res),
        futureEvents: await all_modules.futureEvents(req,res),
        footerBlogs: await all_modules.footerBlogs(req, res)
    };

};


export default causeSingle;