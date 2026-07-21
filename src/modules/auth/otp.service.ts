import { prisma } from '../../lib/prisma.ts';
import nodemailer from 'nodemailer';
import { ApiError } from '../../lib/http-error.ts';
import crypto from 'crypto';

// In a real application, these would be configured via environment variables
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER || 'test@ethereal.email',
    pass: process.env.SMTP_PASS || 'password',
  },
});

export async function requestOtp(email: string) {
  // Generate a 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  
  // Set expiration to 10 minutes from now
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Store in database
  await prisma.otpVerification.create({
    data: {
      email,
      otp,
      expiresAt,
    },
  });

  // Send Email
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Placement Portal" <noreply@placementportal.edu>',
      to: email,
      subject: 'Your Login Code',
      text: `Your login code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Placement Portal Login</h2>
          <p>Your one-time password (OTP) is:</p>
          <h1 style="letter-spacing: 5px; color: #14315E;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });

    // In development with ethereal, you can log the URL to preview the email
    if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    // Even if email fails, we might want to fail silently or throw, depending on reqs.
    // Throwing here so the frontend knows it failed.
    throw ApiError.internal('Failed to send email. Please try again later.');
  }

  return { message: 'OTP sent successfully' };
}

export async function verifyOtp(email: string, otp: string) {
  // Find the most recent OTP for this email
  const record = await prisma.otpVerification.findFirst({
    where: { email, verified: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw ApiError.badRequest('No pending OTP request found for this email.');
  }

  if (record.expiresAt < new Date()) {
    throw ApiError.badRequest('OTP has expired. Please request a new one.');
  }

  if (record.otp !== otp) {
    throw ApiError.badRequest('Invalid OTP.');
  }

  // Mark as verified
  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { verified: true },
  });

  return { message: 'Email verified successfully', recordId: record.id };
}
