import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../dedicated_parents.js';
import Members from '../models/members.js';
import Webinars from '../models/webinars.js';
import { hashPassword } from '../services/memberAuthService.js';

describe('members routes integration', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    process.env.EMAIL_HOST = '';
    process.env.EMAIL_USER = '';
    process.env.EMAIL_PASS = '';
    process.env.EMAIL_PASSWORD = '';
  });

  it('redirects unauthenticated requests to member webinars', async () => {
    const res = await request(app).get('/members/webinars');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/members/login');
  });

  it('signup -> verify -> login -> webinar access/download works', async () => {
    const agent = request.agent(app);
    const savedVerification = jest.fn().mockResolvedValue(true);

    jest.spyOn(Members, 'findOne').mockImplementation(async (query) => {
      if (query.email && query.email === 'new@member.com') {
        if (query.verificationToken) return null;
        return null;
      }

      if (query.verificationToken) {
        return {
          emailVerified: false,
          status: 'pending',
          save: savedVerification,
        };
      }

      if (query.email === 'active@member.com') {
        const { salt, hash } = await hashPassword('Strong1!pass');
        return {
          _id: '507f1f77bcf86cd799439011',
          name: 'Active Member',
          email: 'active@member.com',
          status: 'active',
          emailVerified: true,
          passwordSalt: salt,
          passwordHash: hash,
        };
      }

      return null;
    });

    jest.spyOn(Members, 'create').mockResolvedValue({ _id: '507f191e810c19729de860ea' });

    const webinarListLean = jest.fn().mockResolvedValue([
      {
        _id: '507f191e810c19729de860eb',
        slug: 'week-1',
        title: 'Week 1 Webinar',
        summary: 'summary',
        streamPlaybackId: 'abc123',
        published: true,
        publishedAt: new Date().toISOString(),
        attachments: [
          {
            _id: '507f191e810c19729de860ec',
            label: 'Worksheet',
            storageKey: 'webinars/week-1/worksheet.pdf',
            sortOrder: 1,
          },
        ],
      },
    ]);

    jest.spyOn(Webinars, 'find').mockReturnValue({
      sort: () => ({ lean: webinarListLean }),
    });

    jest.spyOn(Webinars, 'findOne').mockImplementation(async (query) => {
      if (query.slug) {
        return {
          _id: '507f191e810c19729de860eb',
          slug: 'week-1',
          title: 'Week 1 Webinar',
          summary: 'summary',
          content: '<p>Body</p>',
          streamPlaybackId: 'abc123',
          published: true,
          publishedAt: new Date().toISOString(),
          attachments: [
            {
              _id: '507f191e810c19729de860ec',
              label: 'Worksheet',
              storageKey: 'webinars/week-1/worksheet.pdf',
              sortOrder: 1,
            },
          ],
        };
      }

      return {
        _id: '507f191e810c19729de860eb',
        published: true,
        publishedAt: new Date().toISOString(),
        attachments: [
          {
            _id: { toString: () => '507f191e810c19729de860ec' },
            label: 'Worksheet',
            storageKey: 'webinars/week-1/worksheet.pdf',
          },
        ],
      };
    });

    const signupRes = await agent.post('/members/signup').send({
      name: 'New Member',
      email: 'new@member.com',
      password: 'Strong1!pass',
    });
    expect(signupRes.status).toBe(201);
    expect(signupRes.body.success).toBe(true);

    const verifyRes = await agent.get('/members/verify-email?token=testtoken');
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.text).toContain('Email verified');

    const loginRes = await agent.post('/members/login').send({
      email: 'active@member.com',
      password: 'Strong1!pass',
    });
    expect(loginRes.status).toBe(200);

    const webinarsRes = await agent.get('/members/webinars');
    expect(webinarsRes.status).toBe(200);
    expect(webinarsRes.text).toContain('Week 1 Webinar');

    const detailRes = await agent.get('/members/webinars/week-1');
    expect(detailRes.status).toBe(200);
    expect(detailRes.text).toContain('Download Worksheet');
  });

  it('disabled members cannot authenticate', async () => {
    const { salt, hash } = await hashPassword('Strong1!pass');

    jest.spyOn(Members, 'findOne').mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      name: 'Disabled Member',
      email: 'disabled@member.com',
      status: 'disabled',
      emailVerified: true,
      passwordSalt: salt,
      passwordHash: hash,
    });

    const res = await request(app).post('/members/login').send({
      email: 'disabled@member.com',
      password: 'Strong1!pass',
    });

    expect(res.status).toBe(403);
  });
});
