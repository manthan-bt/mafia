import nodemailer from 'nodemailer';
import { randomInt } from 'crypto';

// ─── CONFIG ─────────────────────────────────────────────────────────────────
// Set these in your .env file:
//   EMAIL_HOST=smtp.gmail.com
//   EMAIL_PORT=587
//   EMAIL_USER=your@gmail.com
//   EMAIL_PASS=your-app-password    ← Gmail: Settings > Security > App Passwords
//   EMAIL_FROM="Nightfall Protocol <your@gmail.com>"

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,  // true for 465, false for 587 STARTTLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
});

// ─── OTP STORE ───────────────────────────────────────────────────────────────
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface OTPRecord {
    otp: string;
    expiresAt: number;
    attempts: number;
}

const otpStore = new Map<string, OTPRecord>(); // keyed by email (lowercase)

// ─── OTP GENERATION ──────────────────────────────────────────────────────────
export function generateOTP(): string {
    return String(randomInt(100000, 999999)); // cryptographically random 6-digit
}

export function storeOTP(email: string, otp: string): void {
    otpStore.set(email.toLowerCase(), {
        otp,
        expiresAt: Date.now() + OTP_TTL_MS,
        attempts: 0,
    });
}

export type OTPVerifyResult =
    | { ok: true }
    | { ok: false; error: string; locked?: boolean };

export function verifyOTP(email: string, inputOtp: string): OTPVerifyResult {
    const key = email.toLowerCase();
    const record = otpStore.get(key);

    if (!record) return { ok: false, error: 'No OTP requested for this email.' };
    if (Date.now() > record.expiresAt) {
        otpStore.delete(key);
        return { ok: false, error: 'OTP has expired. Request a new one.' };
    }
    record.attempts++;
    if (record.attempts > 5) {
        otpStore.delete(key);
        return { ok: false, error: 'Too many incorrect attempts. Request a new OTP.', locked: true };
    }
    if (record.otp !== inputOtp.trim()) {
        return { ok: false, error: `Incorrect OTP. ${5 - record.attempts + 1} attempts remaining.` };
    }

    otpStore.delete(key); // consume it — single use
    return { ok: true };
}

// ─── EMAIL TEMPLATE ──────────────────────────────────────────────────────────
function buildOTPEmail(otp: string, alias: string = 'Operative'): { subject: string; html: string; text: string } {
    const subject = `[Nightfall Protocol] Your Recovery OTP: ${otp}`;

    const text = [
        '╔══════════════════════════════════╗',
        '║   NIGHTFALL PROTOCOL — SECURITY  ║',
        '╚══════════════════════════════════╝',
        '',
        `Operative ${alias},`,
        '',
        'A password reset was requested for your account.',
        '',
        `  YOUR ONE-TIME PASSCODE:  ${otp}`,
        '',
        'This code expires in 10 minutes.',
        'Do NOT share it with anyone.',
        '',
        'If you did not request this, ignore this message.',
        '',
        '— The Nightfall Protocol Security Team',
    ].join('\n');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080810;font-family:'Courier New',monospace;color:#EAEAEA;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080810;min-height:100vh;">
    <tr><td align="center" style="padding:48px 16px;">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="text-align:center;padding-bottom:32px;">
            <div style="display:inline-block;padding:6px 20px;border:1px solid rgba(204,10,30,0.4);border-radius:999px;background:rgba(204,10,30,0.08);">
              <span style="font-size:9px;font-weight:900;letter-spacing:0.5em;color:#CC0A1E;text-transform:uppercase;">Nightfall Protocol</span>
            </div>
          </td>
        </tr>

        <!-- CARD -->
        <tr>
          <td style="background:rgba(14,14,28,0.98);border:1px solid rgba(204,10,30,0.25);border-radius:24px;overflow:hidden;">

            <!-- TOP ACCENT BAR -->
            <div style="height:2px;background:linear-gradient(to right,transparent,#CC0A1E,#E8152A,#CC0A1E,transparent);"></div>

            <div style="padding:40px 40px 32px;">

              <!-- ICON -->
              <div style="text-align:center;margin-bottom:28px;">
                <div style="display:inline-block;width:64px;height:64px;border-radius:16px;background:rgba(204,10,30,0.12);border:1px solid rgba(204,10,30,0.35);line-height:64px;font-size:28px;">
                  🔐
                </div>
              </div>

              <!-- TITLE -->
              <h1 style="margin:0 0 8px;text-align:center;font-size:24px;font-weight:900;letter-spacing:-1px;color:#fff;text-transform:uppercase;">
                Security Verification
              </h1>
              <p style="margin:0 0 32px;text-align:center;font-size:11px;color:#555;letter-spacing:0.3em;text-transform:uppercase;">
                One-Time Recovery Passcode
              </p>

              <!-- GREETING -->
              <p style="margin:0 0 24px;font-size:13px;color:#888;">
                Operative ${alias}, a password reset was requested for your Nightfall Protocol account.
              </p>

              <!-- OTP BOX -->
              <div style="background:rgba(204,10,30,0.08);border:1px solid rgba(204,10,30,0.3);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;
                          box-shadow:0 0 40px rgba(204,10,30,0.15);">
                <p style="margin:0 0 8px;font-size:9px;font-weight:900;letter-spacing:0.5em;color:#555;text-transform:uppercase;">
                  Your OTP Code
                </p>
                <div style="font-size:42px;font-weight:900;letter-spacing:0.25em;color:#E8152A;font-family:'Courier New',monospace;
                            text-shadow:0 0 20px rgba(232,21,42,0.5);">
                  ${otp}
                </div>
                <p style="margin:10px 0 0;font-size:10px;color:#444;letter-spacing:0.2em;text-transform:uppercase;">
                  Expires in 10 minutes
                </p>
              </div>

              <!-- SECURITY NOTE -->
              <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:24px;">
                <p style="margin:0;font-size:10px;color:#444;line-height:1.7;letter-spacing:0.05em;">
                  ⚠️ &nbsp;Do <strong style="color:#888;">NOT</strong> share this code with anyone.<br>
                  🔒 &nbsp;Nightfall staff will never ask for your OTP.<br>
                  ⏱️ &nbsp;This code is valid for one use only.
                </p>
              </div>

              <!-- NOT YOU? -->
              <p style="margin:0;font-size:11px;color:#333;text-align:center;letter-spacing:0.05em;">
                If you did not request this, you can safely ignore this message.
              </p>
            </div>

            <!-- FOOTER -->
            <div style="border-top:1px solid rgba(255,255,255,0.04);padding:20px 40px;display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:9px;color:#333;letter-spacing:0.3em;text-transform:uppercase;">© Nightfall Protocol</span>
              <span style="font-size:9px;color:#333;letter-spacing:0.3em;text-transform:uppercase;">ENCRYPTED · TLS 1.3</span>
            </div>

          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    return { subject, html, text };
}

// ─── SEND OTP EMAIL ──────────────────────────────────────────────────────────
export async function sendOTPEmail(email: string, otp: string, alias?: string): Promise<{ ok: boolean; error?: string }> {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        // Dev fallback — log to console
        console.log(`\n╔══════════════════════════╗`);
        console.log(`║  OTP for ${email.padEnd(16)} ║`);
        console.log(`║  Code: ${otp}              ║`);
        console.log(`╚══════════════════════════╝\n`);
        return { ok: true };
    }

    try {
        const { subject, html, text } = buildOTPEmail(otp, alias);
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || `"Nightfall Protocol" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            text,
            html,
        });
        return { ok: true };
    } catch (err: any) {
        console.error('Email send error:', err.message);
        return { ok: false, error: 'Failed to send email. Check server email configuration.' };
    }
}
