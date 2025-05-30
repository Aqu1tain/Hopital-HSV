import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter at startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Erreur configuration SMTP:', error);
  } else {
    console.log('SMTP configuré et prêt à envoyer des emails');
  }
});