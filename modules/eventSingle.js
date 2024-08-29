import all_modules from './all_modules.js';

const eventSingle = async function(req,res) {
        return {
            futureEvents: await all_modules.futureEvents(req,res),
            event: await all_modules.getEvent(req,res),
            gallery: await all_modules.gallery(req,res),
            footerBlogs: await all_modules.footerBlogs(req, res)
        }
    };

export default eventSingle;
