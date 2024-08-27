import all_modules from './all_modules.js';
import createModel from './createModel.js';
import * as comments from './getComments.js';

const blogPost = async function(req,res) {
    return {
        blog: await all_modules.blog(req,res), 
        comments: await comments.getComments(req,res),
        countComments: await comments.countComments(req,res), 
        footerBlogs: await all_modules.footerBlogs(req, res),
        futureEvents: await all_modules.futureEvents(req,res), 
        gallery: await all_modules.gallery(req,res),
    };
};


export default blogPost;