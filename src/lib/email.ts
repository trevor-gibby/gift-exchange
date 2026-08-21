import "server-only";

import nodemailer from "nodemailer";

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM,
  );
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!smtpConfigured()) return false;

  await createTransporter().sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Reset your Gift Exchange password",
    text: `Use this link to reset your password. It expires in one hour:\n\n${resetUrl}`,
    html: `<p>Use the button below to reset your Gift Exchange password. This link expires in one hour.</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });

  return true;
}

export async function sendEmailVerificationEmail(email: string, verificationUrl: string) {
  if (!smtpConfigured()) return false;

  await createTransporter().sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verify your Gift Exchange email",
    text: `Verify your email to finish creating your Gift Exchange account. This link expires in 24 hours:\n\n${verificationUrl}`,
    html: `<p>Verify your email to finish creating your Gift Exchange account.</p><p><a href="${verificationUrl}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
  });

  return true;
}
