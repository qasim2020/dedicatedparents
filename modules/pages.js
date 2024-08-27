import all_modules from './all_modules.js';

const pages = async function(req,res) {
    return {
        pages: await all_modules.pages(req,res),
        futureEvents: await all_modules.futureEvents(req,res),
        gallery: await all_modules.gallery(req,res),
        footerBlogs: await all_modules.footerBlogs(req, res)
    }
};

export default pages;
