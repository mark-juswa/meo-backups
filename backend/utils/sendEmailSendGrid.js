import sgMail from '@sendgrid/mail';

export const sendVerificationEmail = async (to, token) => {
  try {
    if (!process.env.SENDGRID_API_KEY || !process.env.CLIENT_URL) {
      console.error("❌ SENDGRID_API_KEY or CLIENT_URL missing!");
      console.error("SENDGRID_API_KEY exists:", !!process.env.SENDGRID_API_KEY);
      console.error("CLIENT_URL exists:", !!process.env.CLIENT_URL);
      throw new Error("SendGrid configuration missing. Please check your environment variables.");
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      console.error("❌ SENDGRID_FROM_EMAIL missing!");
      throw new Error("SendGrid FROM email is required. Please set SENDGRID_FROM_EMAIL environment variable.");
    }

    // Set SendGrid API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
    console.log("📧 SendGrid HTTP API - Sending verification email");
    console.log("Token:", token);
    console.log("Verify URL:", verifyUrl);
    console.log("To recipient:", to);
    console.log("From:", process.env.SENDGRID_FROM_EMAIL);

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Verify Your Email - MEO Online Services",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1D4ED8; text-align: center; margin-bottom: 30px;">Email Verification Required</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello,</p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Thank you for registering with MEO Online Services. To complete your registration, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="display: inline-block; padding: 15px 30px; background-color: #1D4ED8; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Verify My Email
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              <strong>Important:</strong> This verification link will expire in 15 minutes for security reasons.
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              If you did not create this account, please ignore this email and no further action is required.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              MEO Online Services<br>
              San Vicente, Palawan
            </p>
          </div>
        </div>
      `,
    };

    console.log("📤 Sending email via SendGrid HTTP API...");
    const response = await sgMail.send(msg);
    console.log("✅ SendGrid - Verification email sent successfully!");
    console.log("Response status:", response[0].statusCode);
    console.log("Response headers:", response[0].headers);
    
    return { success: true, statusCode: response[0].statusCode };
    
  } catch (error) {
    console.error("❌ SendGrid - Failed to send verification email");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error response body:", error.response?.body);
    console.error("Full error:", error);
    throw new Error(`SendGrid email sending failed: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (to, token) => {
  try {
    if (!process.env.SENDGRID_API_KEY || !process.env.CLIENT_URL) {
      console.error("❌ SENDGRID_API_KEY or CLIENT_URL missing!");
      throw new Error("SendGrid configuration missing.");
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      console.error("❌ SENDGRID_FROM_EMAIL missing!");
      throw new Error("SendGrid FROM email is required.");
    }

    // Set SendGrid API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    console.log("📧 SendGrid HTTP API - Sending password reset email");
    console.log("To recipient:", to);
    console.log("Reset URL:", resetUrl);
    console.log("From:", process.env.SENDGRID_FROM_EMAIL);

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Reset Your Password - MEO Online Services",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1D4ED8; text-align: center;">Password Reset Request</h2>
            <p style="color: #333; line-height: 1.6;">Hello,</p>
            <p style="color: #333; line-height: 1.6;">You requested a password reset. Click the button below to set a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 15px 30px; background-color: #1D4ED8; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
            <p style="color: #666; font-size: 14px;">If you didn't ask for this, please verify your account security immediately.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              MEO Online Services<br>
              San Vicente, Palawan
            </p>
          </div>
        </div>
      `,
    };

    console.log("📤 Sending password reset email via SendGrid HTTP API...");
    const response = await sgMail.send(msg);
    console.log("✅ SendGrid - Password reset email sent successfully!");
    console.log("Response status:", response[0].statusCode);
    
    return { success: true, statusCode: response[0].statusCode };
    
  } catch (error) {
    console.error("❌ SendGrid - Failed to send reset email");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error response body:", error.response?.body);
    console.error("Full error:", error);
    throw new Error(`SendGrid email sending failed: ${error.message}`);
  }
};
