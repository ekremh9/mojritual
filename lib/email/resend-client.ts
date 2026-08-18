import { Resend } from 'resend';

export const resendClient = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = process.env.EMAIL_FROM!;
