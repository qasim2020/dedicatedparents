import subscribe from '../modules/subscribe.js';
import createModel from '../modules/createModel.js';

describe('subscribe function', () => {
    let req, res;

    beforeEach(() => {
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

    it('should return 404 if user is already subscribed', async () => {
        const model = await createModel('dedicated_parents-subscribers');
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
    //     const model = await createModel('dedicated_parents-subscribers');
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

    it('should return 500 if there is an error during subscription', async () => {
        // Simulate an error by providing incorrect brand name
        req.params.brand = 'nonExistantBrand';

        const result = await subscribe(req, res);

        expect(result.status).toBe(500);
        expect(result.error).toBe('Failed to process subscription request.');
    });
});
