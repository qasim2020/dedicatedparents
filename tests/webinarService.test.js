import { jest } from '@jest/globals';
import {
  createUniqueWebinarSlug,
  normalizePlaybackId,
  listPublishedWebinars,
} from '../services/webinarService.js';

describe('webinarService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates unique slug when collisions exist', async () => {
    const exists = jest
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const slug = await createUniqueWebinarSlug({ exists }, 'My Webinar');
    expect(slug).toBe('my-webinar-3');
  });

  it('normalizes playback IDs from urls', () => {
    expect(normalizePlaybackId('https://cloudflarestream.com/abc123/iframe')).toBe('abc123');
    expect(normalizePlaybackId('abc999')).toBe('abc999');
  });

  it('filters published query and maps embed url', async () => {
    const lean = jest.fn().mockResolvedValue([
      {
        title: 'A',
        streamPlaybackId: 'playback123',
      },
    ]);
    const sort = jest.fn(() => ({ lean }));
    const find = jest.fn(() => ({ sort }));

    const output = await listPublishedWebinars({ find });

    expect(find).toHaveBeenCalledWith({
      published: true,
      publishedAt: { $lte: expect.any(Date) },
    });
    expect(output[0].embedUrl).toBe('https://iframe.videodelivery.net/playback123');
  });
});
