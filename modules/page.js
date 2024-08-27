import all_modules from './all_modules.js';
import * as comments from './getComments.js';

const page = async function(req,res) {
    return {
        page: await all_modules.page(req,res),
        comments: await comments.getComments(req,res),
        countComments: await comments.countComments(req,res),
        gallery: await all_modules.gallery(req,res),
        footerBlogs: await all_modules.footerBlogs(req, res)
    }
};

export default page;
