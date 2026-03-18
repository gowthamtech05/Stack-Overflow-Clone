import nodemailer from "nodemailer";

// ✅ Brevo SMTP — works on Render free tier
const createTransporter = () =>
  nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
  });

export const sendPasswordResetEmail = async (email, newPassword) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Stack Overflow Clone" <${process.env.BREVO_SMTP_USER}>`,
    to: email,
    subject: "Your New Password",
    text: `Your new password is: ${newPassword}\n\n`,
  });
};

export const sendOTPEmail = async (email, subject, otp) => {
  const transporter = createTransporter();

  const isLogin = subject?.toLowerCase().includes("login");
  const isRegister = subject?.toLowerCase().includes("verify");

  const title = isRegister
    ? "Verify your account"
    : isLogin
      ? "Login Verification"
      : "Your OTP Code";

  const description = isRegister
    ? "You're almost there! Use the OTP below to verify your email and complete registration."
    : isLogin
      ? "Use the OTP below to complete your login."
      : "Use the OTP below to proceed.";

  await transporter.sendMail({
    from: `"Stack Overflow Clone" <${process.env.BREVO_SMTP_USER}>`,
    to: email,
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
        <h2 style="color: #f97316;">${title}</h2>
        <p>${description}</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #6b7280;">Your OTP</p>
          <h1 style="margin: 8px 0; color: #111; letter-spacing: 8px;">${otp}</h1>
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">Valid for 10 minutes</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};
