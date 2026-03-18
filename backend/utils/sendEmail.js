import * as Brevo from "@getbrevo/brevo";

// ✅ Create Brevo client
const getClient = () => {
  const client = new Brevo.TransactionalEmailsApi();

  client.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY,
  );

  return client;
};

// ✅ Common sender (IMPORTANT: must be verified in Brevo)
const SENDER = {
  email: process.env.BREVO_SENDER_EMAIL, // use separate env
  name: "Stack Overflow Clone",
};

// ✅ Password Reset Email
export const sendPasswordResetEmail = async (email, newPassword) => {
  try {
    const client = getClient();

    const mail = new Brevo.SendSmtpEmail();
    mail.to = [{ email }];
    mail.sender = SENDER;
    mail.subject = "Your New Password";
    mail.textContent = `Your new password is: ${newPassword}`;

    const response = await client.sendTransacEmail(mail);
    console.log("Password email sent:", response);
  } catch (error) {
    console.error(
      "Password Email Error:",
      error.response?.body || error.message,
    );
  }
};

// ✅ OTP Email
export const sendOTPEmail = async (email, subject, otp) => {
  try {
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
    mail.sender = SENDER;
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

        <p style="color: #6b7280; font-size: 12px;">
          If you didn't request this, ignore this email.
        </p>
      </div>
    `;

    const response = await client.sendTransacEmail(mail);
    console.log("OTP email sent:", response);
  } catch (error) {
    console.error("OTP Email Error:", error.response?.body || error.message);
  }
};
