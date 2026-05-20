import mongoose from 'mongoose';
import qpm from 'query-params-mongo';
import Blogs from '../models/blogs.js';
import Gallery from '../models/gallery.js';
import Causes from '../models/causes.js';
import Events from '../models/events.js';
import Team from '../models/team.js';

let getObjectId = function(val) {
    return mongoose.Types.ObjectId(val);
};

var processQuery = qpm({
    autoDetect: [
        { fieldPattern: /_id$/, dataType: 'objectId' },
        { fieldPattern: /orderNo$/, dataType: 'string' },
    ],
    converters: {objectId: getObjectId }
});

const parseEventDate = (event) => {
    const value = event?.eventDate || event?.date || event?.newDate || null;
    if (!value) return null;

    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
};

const isFeaturedEvent = (event) => {
    const featureValue = event?.isFeatured ?? event?.featured;
    if (typeof featureValue === 'boolean') return featureValue;
    if (typeof featureValue === 'string') {
        const normalized = featureValue.replace(/^"|"$/g, '').trim().toLowerCase();
        return normalized === 'true' || normalized === '1' || normalized === 'yes';
    }
    if (typeof featureValue === 'number') return featureValue === 1;
    return false;
};

const normalizeHomepageEvent = (event) => {
    const parsedDate = parseEventDate(event);
    return {
        ...event,
        title: event?.title || event?.name || 'Untitled Event',
        bannerImg: event?.bannerImg || event?.coverImageUrl || '',
        summary: event?.summary || event?.excerpt || '',
        date: event?.date || (parsedDate ? parsedDate.toISOString() : ''),
        parsedDate,
        featuredResolved: isFeaturedEvent(event),
    };
};

const all_modules = {
    twoBlogs: async function (req, res) {
        const model = Blogs;
        let blogs = await model.find({ visibility: "blog" }).limit(2);
        return blogs;
    },

    footerBlogs: async function (req, res) {
        const model = Blogs;
        let blogs = await model.find({ visibility: "page" }).limit(5);
        return blogs;
    },

    threePages: async function (req, res) {
        const model = Blogs;
        return {
            education: await model.findOne({ slug: "education" }).lean(),
            helpAndSupport: await model.findOne({ slug: "help-and-support" }).lean(),
            volunteering: await model.findOne({ slug: "volunteering" }).lean()
        };
    },

    gallery: async function (req, res) {
        const model = Gallery;
        // Keep website gallery placement consistent with dp-admin latest-first ordering.
        let output = await model.find().sort({ sortOrder: -1, createdAt: -1, _id: -1 }).lean();
        return output;
    },

    causes: async function (req, res) {
        const model = Causes;
        let output = await model.find().lean();
        output = output.map(val => {
            val.number = val.bannerImg.split("/image/upload/")[1].split("/dedicatedparents/")[0];
            val.imgSlug = val.bannerImg.split("/causes-photos/")[1];
            return val;
        });
        return output;
    },

    pastThreeEvents: async function (req, res) {

        req.query = processQuery(req.query);
        const model = Events;
        const now = new Date();
        const output = (await model.find().lean())
            .map(normalizeHomepageEvent)
            .filter((event) => event.featuredResolved && event.parsedDate && event.parsedDate < now)
            .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime())
            .slice(0, 3);

        return output;

    },

    futureThreeEvents: async function (req, res) {
    
        req.query = processQuery(req.query);
        const model = Events;
        const now = new Date();
        const output = (await model.find().lean())
            .map(normalizeHomepageEvent)
            .filter((event) => event.featuredResolved && event.parsedDate && event.parsedDate > now)
            .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
            .slice(0, 3);

        return output;
    
    },    

    pastEvents: async function (req, res) {
        req.query = processQuery(req.query);
        const model = Events;
        const now = new Date();
        const output = (await model.find().lean())
            .map(normalizeHomepageEvent)
            .filter((event) => event.parsedDate && event.parsedDate < now)
            .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());

        return output;

    },

    futureEvents: async function (req, res) {

        req.query = processQuery(req.query);
        const model = Events;
        const now = new Date();
        const output = (await model.find().lean())
            .map(normalizeHomepageEvent)
            .filter((event) => event.parsedDate && event.parsedDate > now)
            .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

        return output;

    },

    futureFeaturedEvents: async function (req, res) {

        req.query = processQuery(req.query);
        const model = Events;
        const now = new Date();
        const output = (await model.find().lean())
            .map(normalizeHomepageEvent)
            .filter((event) => event.parsedDate && event.parsedDate > now && event.featuredResolved)
            .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

        return output;

    },

    staffs: async function (req, res) {
        const model = Team;
        // Keep website team sequence consistent with dp-admin drag/drop ordering.
        let output = await model.find().sort({ sortOrder: -1, createdAt: -1, _id: -1 }).lean();
        return output;
    },

    blogPosts: async function(req,res) {
        const model = Blogs;
        let output = await model.find({visibility: "blog"}).sort({_id: -1}).lean();
        output = output.map( val => {
            val.number = val.bannerImg.split("/image/upload/")[1].split("/dedicatedparents/")[0];
            val.imgSlug = val.bannerImg.split("/blogs-photos/")[1]
            return val;
        });
        return output;
    },

    pages: async function(req,res) {
        const model = Blogs;
        let output = await model.find({visibility: "page"}).sort({_id: -1}).lean();
        output = output.map( val => {
            val.number = val.bannerImg.split("/image/upload/")[1].split("/dedicatedparents/")[0];
            val.imgSlug = val.bannerImg.split("/pages-photos/")[1]
            return val;
        });
        return output;
    },

    blog: async function(req,res) {
        const model = Blogs;

        // Find the current document based on the slug
        let currentDocument = await model.findOne({ slug: req.params.slug }).lean();

        if (!currentDocument) {
            return res.status(404).json({ message: 'Document not found' });
        };

        currentDocument.number = currentDocument.bannerImg.split("/image/upload/")[1].split("/dedicatedparents/")[0];
        currentDocument.imgSlug = currentDocument.bannerImg.split("/blogs-photos/")[1];

        // Find the next document (using _id for simplicity, assuming it's auto-incremented or timestamped)
        let nextDocument = await model.findOne({ 
            _id: { $gt: currentDocument._id } ,
            visibility: "blog"
        }).sort({ _id: 1 }).lean();

        // Find the previous document
        let prevDocument = await model.findOne({ 
            _id: { $lt: currentDocument._id } ,
            visibility: "blog"
        }).sort({ _id: -1 }).lean();

        if (!nextDocument) {
            nextDocument = await model.findOne({visibility: "blog"}).sort({ _id: 1 }).lean();
        };

        // If no previous document is found, fetch the last document (wrap around)
        if (!prevDocument) {
            prevDocument = await model.findOne({visibility: "blog"}).sort({ _id: -1 }).lean();
        };

        // Return the current, next, and previous documents
        return {
            current: currentDocument,
            next: nextDocument,
            prev: prevDocument
        };
    },

    page: async function(req,res) {
        const model = Blogs;

        // Find the current document based on the slug
        let currentDocument = await model.findOne({ slug: req.params.slug }).lean();

        if (!currentDocument) {
            return res.status(404).json({ message: 'Document not found' });
        };

        currentDocument.number = currentDocument.bannerImg.split("/image/upload/")[1].split("/dedicatedparents/")[0];
        currentDocument.imgSlug = currentDocument.bannerImg.split("/pages-photos/")[1];

        // Find the next document (using _id for simplicity, assuming it's auto-incremented or timestamped)
        let nextDocument = await model.findOne({ 
            _id: { $gt: currentDocument._id } ,
            visibility: "page"
        }).sort({ _id: 1 }).lean();

        // Find the previous document
        let prevDocument = await model.findOne({ 
            _id: { $lt: currentDocument._id } ,
            visibility: "page"
        }).sort({ _id: -1 }).lean();

        if (!nextDocument) {
            nextDocument = await model.findOne({visibility: "page"}).sort({ _id: 1 }).lean();
        };

        // If no previous document is found, fetch the last document (wrap around)
        if (!prevDocument) {
            prevDocument = await model.findOne({visibility: "page"}).sort({ _id: -1 }).lean();
        };

        // Return the current, next, and previous documents
        return {
            current: currentDocument,
            next: nextDocument,
            prev: prevDocument
        };
    },

    getCause: async function(req,res) {
        const model = Causes;

        // Find the current document based on the slug
        let currentDocument = await model.findOne({ slug: req.params.slug }).lean();

        if (!currentDocument) {
            return res.status(404).json({ message: 'Document not found' });
        };

        currentDocument.number = currentDocument.bannerImg.split("/image/upload/")[1].split("/dedicatedparents/")[0];
        currentDocument.imgSlug = currentDocument.bannerImg.split("/causes-photos/")[1];

        // Find the next document (using _id for simplicity, assuming it's auto-incremented or timestamped)
        let nextDocument = await model.findOne({ _id: { $gt: currentDocument._id } }).sort({ _id: 1 }).lean();

        // Find the previous document
        let prevDocument = await model.findOne({ _id: { $lt: currentDocument._id } }).sort({ _id: -1 }).lean();

        // If no next document is found, fetch the first document (wrap around)
        if (!nextDocument) {
            nextDocument = await model.findOne().sort({ _id: 1 }).lean();
        };

        // If no previous document is found, fetch the last document (wrap around)
        if (!prevDocument) {
            prevDocument = await model.findOne().sort({ _id: -1 }).lean();
        };

        // Return the current, next, and previous documents
        return {
            current: currentDocument,
            next: nextDocument,
            prev: prevDocument
        };
    },

    getStaff: async function(req,res) {
        const model = Team;

        // Find the current document based on the slug
        let currentDocument = await model.findOne({ slug: req.params.slug }).lean();

        if (!currentDocument) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Find the next document (using _id for simplicity, assuming it's auto-incremented or timestamped)
        let nextDocument = await model.findOne({ _id: { $gt: currentDocument._id } }).sort({ _id: 1 }).lean();

        // Find the previous document
        let prevDocument = await model.findOne({ _id: { $lt: currentDocument._id } }).sort({ _id: -1 }).lean();

        // If no next document is found, fetch the first document (wrap around)
        if (!nextDocument) {
            nextDocument = await model.findOne().sort({ _id: 1 }).lean();
        }

        // If no previous document is found, fetch the last document (wrap around)
        if (!prevDocument) {
            prevDocument = await model.findOne().sort({ _id: -1 }).lean();
        }

        // Return the current, next, and previous documents
        return {
            current: currentDocument,
            next: nextDocument,
            prev: prevDocument
        };

    },

    getEvent: async function(req,res) {
        const model = Events;

        // Find the current document based on the slug
        let currentDocument = await model.findOne({ slug: req.params.slug }).lean();

        if (!currentDocument) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Find the next document (using _id for simplicity, assuming it's auto-incremented or timestamped)
        let nextDocument = await model.findOne({ _id: { $gt: currentDocument._id } }).sort({ _id: 1 }).lean();

        // Find the previous document
        let prevDocument = await model.findOne({ _id: { $lt: currentDocument._id } }).sort({ _id: -1 }).lean();

        // If no next document is found, fetch the first document (wrap around)
        if (!nextDocument) {
            nextDocument = await model.findOne().sort({ _id: 1 }).lean();
        }

        // If no previous document is found, fetch the last document (wrap around)
        if (!prevDocument) {
            prevDocument = await model.findOne().sort({ _id: -1 }).lean();
        }

        // Return the current, next, and previous documents
        return {
            current: currentDocument,
            next: nextDocument,
            prev: prevDocument
        }

    }
};

export default all_modules;