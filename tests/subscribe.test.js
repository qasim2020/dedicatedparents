import subscribe from '../modules/subscribe.js';
import Subscribers from '../models/subscribers.js';
import mongoose from 'mongoose';

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
    await mongoose.disconnect();
});

describe('subscribe function', () => {
    let req, res;

    beforeEach(async () => {
        await Subscribers.deleteMany({ email: 'famousfakir@yahoo.com' });

        req = {
            params: { brand: 'dedicated_parents' },
            body: {
                email: 'famousfakir@yahoo.com',
                firstName: 'John',
                lastName: 'Doe',
                list: 'public'
            }
        };
        res = {};
    });

    afterEach(async () => {
        await Subscribers.deleteMany({ email: 'famousfakir@yahoo.com' });
    });

    it('should return 404 if user is already subscribed', async () => {
        const model = Subscribers;
        await model.create({
            email: 'famousfakir@yahoo.com',
            firstName: 'John',
            lastName: 'Doe',
            validation: true,
            isUnsubscribed: false,
            list: 'public'
        });

        const result = await subscribe(req, res);

        expect(result.status).toBe(404);
        expect(result.error).toBe('You have already subscribed to the mailing list');
    });

    // it('should successfully subscribe a new user', async () => {
    //     const model = Subscribers;
    //     await model.deleteMany({ email: 'famousfakir@yahoo.com' });
    //     const result = await subscribe(req, res);
    //     const subscriber = await model.findOne({ email: 'famousfakir@yahoo.com' });

    //     expect(result.output).toMatchObject({
    //         email: 'famousfakir@yahoo.com',
    //         firstName: 'John',
    //         lastName: 'Doe',
    //         list: 'public'
    //     });
    //     expect(subscriber).toBeTruthy();
    // });

    it('should allow subscription even when email send fails', async () => {
        await Subscribers.deleteMany({ email: 'famousfakir@yahoo.com' });

        // Simulate an error by providing incorrect brand name
        req.params.brand = 'nonExistantBrand';
        const originalEmailHost = process.env.EMAIL_HOST;
        process.env.EMAIL_HOST = '';

        let result;
        try {
            result = await subscribe(req, res);
        } finally {
            process.env.EMAIL_HOST = originalEmailHost;
        }

        expect(result.success).toBe(true);
        expect(result.emailSent).toBe(false);
        expect(result.warning).toBeTruthy();
    });
});
