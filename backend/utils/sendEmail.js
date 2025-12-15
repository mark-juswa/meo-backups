import nodemailer from "nodemailer";

export const sendVerificationEmail = async (to, token) => {
  try {
    if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD || !process.env.CLIENT_URL) {
      throw new Error("Email configuration missing. Please check your environment variables.");
    }

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
    console.log("Email sent token:", token);
    console.log("Verify URL:", verifyUrl);
    console.log("Attempting to send email from:", process.env.EMAIL_USERNAME);
    console.log("To recipient:", to);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 60000,
      socketTimeout: 60000,
      debug: true, 
    });

    // Verify transporter configuration (ITO YUNG MAKIKITA SA MESSAGE NG EMAIL)
    console.log("Verifying SMTP connection on port 465 (SSL)...");
    await transporter.verify();
    console.log("SMTP connection verified successfully!");

    const mailOptions = {
      from: `"MEO Online Services" <${process.env.EMAIL_USERNAME}>`,
      to,
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

    console.log("Sending email...");
    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully:", info.messageId);
    console.log("Response:", info.response);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error("Failed to send verification email:", error.message);
    console.error("Error code:", error.code);
    console.error("Error command:", error.command);
    console.error("Full error:", error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};




export const sendPasswordResetEmail = async (to, token) => {
  try {
    if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD || !process.env.CLIENT_URL) {
      throw new Error("Email configuration missing.");
    }

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    console.log("Attempting to send password reset email from:", process.env.EMAIL_USERNAME);
    console.log("To recipient:", to);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true, 
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      connectionTimeout: 60000, 
      greetingTimeout: 60000,
      socketTimeout: 60000,
      debug: true,
    });

    console.log("Verifying SMTP connection on port 465 (SSL)...");
    await transporter.verify();
    console.log("SMTP connection verified successfully!");

    const mailOptions = {
      from: `"MEO Online Services" <${process.env.EMAIL_USERNAME}>`,
      to,
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
            <p style="color: #666; font-size: 14px;">If you didn't ask for this, verify your account security immediately.</p>
          </div>
        </div>
      `,
    };

    console.log("Sending password reset email...");
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully:", info.messageId);
    console.log("Response:", info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send reset email:", error.message);
    console.error("Error code:", error.code);
    console.error("Error command:", error.command);
    console.error("Full error:", error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};
