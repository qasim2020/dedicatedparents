import nodemailer from 'nodemailer';
import Settings from '../models/settings.js';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeHexColor(value, fallback = '#0f6ad8') {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  const normalized = raw.startsWith('#') ? raw : `#${raw}`;
  return /^#([0-9a-fA-F]{6})$/.test(normalized) ? normalized.toLowerCase() : fallback;
}

function hexToRgb(hex) {
  const normalized = normalizeHexColor(hex).replace('#', '');
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function toInitials(value) {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'DP';
  return words.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
}

function createTransporter() {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
  const port = Number(process.env.EMAIL_PORT || 465);
  const rawSecure = process.env.EMAIL_SSL;

  if (!host || !user || !pass) {
    throw new Error('Email settings are not configured');
  }

  const secure = rawSecure === undefined
    ? port === 465
    : String(rawSecure).toLowerCase() === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    tls: { rejectUnauthorized: false },
    auth: { user, pass },
  });
}

async function getEmailBranding() {
  const fallbackColor = normalizeHexColor(process.env.BRAND_PRIMARY_COLOR || '#007a78', '#007a78');
  const fallbackBrandName = process.env.BRAND_NAME || process.env.EMAIL_FROM_NAME || 'Dedicated Parents';
  const fallbackLogoUrl = process.env.BRAND_LOGO_URL || '';
  try {
    const settings = await Settings.findOne({ key: 'main' }).lean();
    if (!settings) {
      return { brandName: fallbackBrandName, logoUrl: fallbackLogoUrl, primaryColor: fallbackColor };
    }
    return {
      brandName: settings.brandName || fallbackBrandName,
      logoUrl: settings.logoUrl || fallbackLogoUrl,
      primaryColor: normalizeHexColor(settings.primaryColor || fallbackColor, fallbackColor),
    };
  } catch (error) {
    return { brandName: fallbackBrandName, logoUrl: fallbackLogoUrl, primaryColor: fallbackColor };
  }
}

async function renderMemberActionEmail({
  name,
  brandName,
  portalLabel,
  heading = 'Action Required',
  introLine = '',
  bodyLine = '',
  buttonUrl = '',
  buttonText = 'Continue',
  hint = 'This link expires soon for your security.',
}) {
  const branding = await getEmailBranding();
  const resolvedBrandName = brandName || branding.brandName;
  const resolvedPortalLabel = portalLabel || `${resolvedBrandName} Members`;
  const primaryColor = branding.primaryColor;
  const primaryLight = rgba(primaryColor, 0.20);
  const primaryLighter = rgba(primaryColor, 0.10);
  const primarySoftest = rgba(primaryColor, 0.03);
  const logoUrl = branding.logoUrl || '';

  const safeName = escapeHtml(name || 'Member');
  const safeBrandName = escapeHtml(resolvedBrandName);
  const safePortalLabel = escapeHtml(resolvedPortalLabel);
  const safeHeading = escapeHtml(heading);
  const safeIntroLine = introLine || '';
  const safeBodyLine = bodyLine || '';
  const safeButtonUrl = escapeHtml(buttonUrl);
  const safeButtonText = escapeHtml(buttonText);
  const safeHint = escapeHtml(hint);
  const safePrimaryColor = escapeHtml(primaryColor);
  const safePrimaryLight = escapeHtml(primaryLight);
  const safePrimaryLighter = escapeHtml(primaryLighter);
  const safePrimarySoftest = escapeHtml(primarySoftest);
  const safeLogoUrl = escapeHtml(logoUrl);
  const safeLogoFallback = escapeHtml(toInitials(resolvedBrandName));

  return `
<div style="background:#ffffff; padding:26px 0; font-family: 'Segoe UI', Arial, sans-serif; color:#1f2937;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px; margin:0 auto; background:#ffffff; border-collapse:separate;">
    <tr>
      <td style="padding:30px 34px 22px 34px; text-align:center; background:linear-gradient(180deg, ${safePrimaryLight} 0%, ${safePrimaryLighter} 44%, #ffffff 100%); color:#163b73; border:1px solid #ecf1f8; border-bottom:0;">
        <div style="width:88px; height:88px; margin:0 auto 14px auto; background:${safePrimarySoftest}; border-radius:14px; display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid #eef2f7;">
          ${safeLogoUrl ? `<img src="${safeLogoUrl}" alt="${safeBrandName} logo" style="max-width:74px; max-height:74px; object-fit:contain; display:block;">` : `<div style="width:56px; height:56px; border-radius:50%; background:${safePrimaryColor}; color:#ffffff; font-size:18px; font-weight:700; line-height:56px; text-align:center;">${safeLogoFallback}</div>`}
        </div>
        <div style="font-size:13px; letter-spacing:0.4px; opacity:0.9;">${safePortalLabel}</div>
        <h2 style="margin:8px 0 0 0; font-size:30px; line-height:1.2; color:#0e2f5f;">${safeHeading}</h2>
      </td>
    </tr>
    <tr>
      <td style="padding:2px 34px 8px 34px; font-size:16px; line-height:1.7; border:1px solid #ecf1f8; border-top:0; border-bottom:0;">
        <p style="margin:0 0 12px 0;">Hi ${safeName},</p>
        <p style="margin:0 0 14px 0;">${safeIntroLine}</p>
        <p style="margin:0 0 14px 0;">${safeBodyLine}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 34px 18px 34px; text-align:center; border-left:1px solid #ecf1f8; border-right:1px solid #ecf1f8;">
        <a href="${safeButtonUrl}" style="display:inline-block; text-decoration:none; background:${safePrimaryColor}; color:#ffffff; padding:13px 24px; border-radius:10px; font-weight:600;">${safeButtonText}</a>
      </td>
    </tr>
    <tr>
      <td style="padding:0 34px 20px 34px; border-left:1px solid #ecf1f8; border-right:1px solid #ecf1f8;">
        <div style="background:#f7f9fe; border:1px solid #e3ebff; border-radius:10px; padding:14px 14px; font-size:14px; color:#475569;">
          ${safeHint}
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:0 34px 28px 34px; font-size:13px; color:#6b7280; line-height:1.6; border:1px solid #ecf1f8; border-top:0;">
        If you were not expecting this email, you can safely ignore it.
        <br/><br/>
        With care,<br/>
        ${safeBrandName} Team
      </td>
    </tr>
  </table>
</div>`;
}

async function sendMemberEmail({ to, subject, html }) {
  const transporter = createTransporter();
  const fromName = process.env.EMAIL_FROM_NAME || 'Dedicated Parents';
  const from = process.env.EMAIL_FROM || `"${fromName}" <${process.env.EMAIL_USER}>`;
  await transporter.sendMail({ from, to, subject, html });
}

export {
  renderMemberActionEmail,
  sendMemberEmail,
};
