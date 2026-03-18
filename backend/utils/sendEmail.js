import * as Brevo from "@getbrevo/brevo";

const getClient = () => {
  const client = new Brevo.TransactionalEmailsApi();
  client.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY,
  );
  return client;
};

export const sendPasswordResetEmail = async (email, newPassword) => {
  const client = getClient();
  const mail = new Brevo.SendSmtpEmail();
  mail.to = [{ email }];
  mail.sender = {
    email: process.env.BREVO_SMTP_USER,
    name: "Stack Overflow Clone",
  };
  mail.subject = "Your New Password";
  mail.textContent = `Your new password is: ${newPassword}`;
  await client.sendTransacEmail(mail);
};

export const sendOTPEmail = async (email, subject, otp) => {
  const client = getClient();

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

  const mail = new Brevo.SendSmtpEmail();
  mail.to = [{ email }];
  mail.sender = {
    email: process.env.BREVO_SMTP_USER,
    name: "Stack Overflow Clone",
  };
  mail.subject = title;
  mail.htmlContent = `
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
  `;

  await client.sendTransacEmail(mail);
};
