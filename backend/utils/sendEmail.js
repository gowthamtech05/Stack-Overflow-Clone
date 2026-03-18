import nodemailer from "nodemailer";

export const sendPasswordResetEmail = async (email, newPassword) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your New Password",
    text: `Your new password is: ${newPassword}\n\n`,
  });
};

export const sendOTPEmail = async (email, language, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Language Change OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
        <h2 style="color: #f97316;">Language Change Verification</h2>
        <p>You requested to switch the website language to <strong>${language}</strong>.</p>
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
