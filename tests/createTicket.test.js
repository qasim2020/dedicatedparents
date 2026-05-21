import { jest } from '@jest/globals';
import createTicket from '../modules/createTicket.js';
import Tickets from '../models/tickets.js';

describe('createTicket function', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should create a ticket from contact form fields', async () => {
        const createdTicket = {
            _id: 'ticket-id',
            name: 'Jane Doe',
            email: 'jane@example.com',
            comment: 'Please contact me.',
            meta: '{"country":"SE"}',
        };
        const createSpy = jest.spyOn(Tickets, 'create').mockResolvedValue(createdTicket);

        const result = await createTicket({
            body: {
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane@example.com',
                comment: 'Please contact me.',
                meta: '{"country":"SE"}',
            },
        });

        expect(createSpy).toHaveBeenCalledWith({
            name: 'Jane Doe',
            email: 'jane@example.com',
            comment: 'Please contact me.',
            meta: '{"country":"SE"}',
        });
        expect(result).toEqual({
            success: true,
            output: createdTicket,
        });
    });

    it('should reject ticket creation when required fields are missing', async () => {
        const createSpy = jest.spyOn(Tickets, 'create');

        const result = await createTicket({
            body: {
                firstName: 'Jane',
                email: 'jane@example.com',
            },
        });

        expect(createSpy).not.toHaveBeenCalled();
        expect(result).toEqual({
            status: 400,
            error: 'Required fields are missing.',
        });
    });
});
