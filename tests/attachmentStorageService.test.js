import {
  buildAttachmentStorageKey,
  createSignedDownloadUrl,
} from '../services/attachmentStorageService.js';

describe('attachmentStorageService', () => {
  beforeEach(() => {
    process.env.CLOUDFLARE_R2_ACCOUNT_ID = 'accid123';
    process.env.CLOUDFLARE_R2_BUCKET = 'members-private';
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = 'AKIATESTKEY';
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = 'test-secret-key';
  });

  it('builds scoped attachment keys', () => {
    const key = buildAttachmentStorageKey({ webinarId: 'wb123', fileName: 'My Worksheet.pdf' });
    expect(key.startsWith('webinars/wb123/')).toBe(true);
    expect(key.includes('My-Worksheet.pdf')).toBe(true);
  });

  it('generates signed urls with ttl', () => {
    const signed = createSignedDownloadUrl('webinars/wb123/file.pdf', 90);
    expect(signed.url).toContain('X-Amz-Expires=90');
    expect(signed.url).toContain('/members-private/webinars/wb123/file.pdf');
    expect(new Date(signed.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });
});
