import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/sendEmailSendGrid.js';

export const register = async (req, res) => {
  const { username, first_name, last_name, email, password, phone_number, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const verificationToken = crypto.randomBytes(32).toString("hex");
    console.log("Generated token (register):", verificationToken);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const newUser = new User({
      username,
      first_name,
      last_name,
      email,
      password: password,
      phone_number,
      role,
      isVerified: false,
      verificationToken,
      verificationTokenExpires: expiresAt,
    });

    await newUser.save();

    try {
      await sendVerificationEmail(email, verificationToken);
      res.status(201).json({
        message: "Registration successful! Check your email to verify your account."
      });
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      res.status(201).json({
        message: "Registration successful! However, we couldn't send the verification email. Please contact support.",
        emailError: true
      });
    }
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const login = async (req, res) => {
    const { email, password } = req.body;

    console.log("=== LOGIN ATTEMPT ===");
    console.log("Email:", email);
    console.log("Password provided:", !!password);

    if (!email || !password) {
        console.log("Missing email or password");
        return res.status(400).json({ message: "Please provide email and password" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found with email:", email);
            return res.status(400).json({ message: "Invalid credentials" });
        }

        console.log("User found:", user.email);
        console.log("User verified:", user.isVerified);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match:", isMatch);
        
        if (!isMatch) {
            console.log("Password does not match");
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (!user.isVerified) {
            console.log("User not verified");
            return res.status(403).json({ 
                message: "Please verify your email before logging in. If you didn't receive the verification email, please use the 'Resend Verification Email' option on the login page.",
                requiresVerification: true
            });
        }

        console.log("Login successful for:", user.email);

        const accessToken = jwt.sign(
            { 
                userId: user._id, 
                role: user.role 
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            { 
                userId: user._id, 
                role: user.role 
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
        });

        res.status(200).json({ 
            accessToken, 
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken;

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const newAccessToken = jwt.sign(
            { 
                userId: user._id,   
                role: user.role 
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({ accessToken: newAccessToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
         });


    }catch (error) {
        console.error("Error verifying refresh token:", error);
        return res.status(403).json({ message: "Server Error" });
    }
}

export const logout = (req, res) => {
    try {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({ message: "Logged out successfully" });

    }
    catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

// VERIFY EMAIL

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    console.log("=== VERIFICATION ATTEMPT ===");
    console.log("Token from URL:", token);
    console.log("Token length:", token.length);
    console.log("Token type:", typeof token);

    const allUsers = await User.find({});
    console.log(`Total users in DB: ${allUsers.length}`);
    
    const usersWithTokens = allUsers.filter(u => u.verificationToken);
    console.log(`Users with verification tokens: ${usersWithTokens.length}`);
    
    if (usersWithTokens.length > 0) {
      usersWithTokens.forEach(u => {
        console.log(`- User ${u.email}: token=${u.verificationToken}, match=${u.verificationToken === token}`);
      });
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      //console.log("No user found with that token.");
      return res.status(400).json({ 
        message: "This verification link has already been used. If you've already verified your account, please login. Otherwise, request a new verification email." 
      });
    }

    //console.log("User found:", user.email);

    if (!user.verificationTokenExpires || user.verificationTokenExpires < Date.now()) {
      console.log("Token expired for user:", user.email);
      return res.status(400).json({ message: "Verification token expired." });
    }

    // Update user verification status directly in database to avoid triggering pre-save hooks
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { 
        $set: { isVerified: true },
        $unset: { verificationToken: "", verificationTokenExpires: "" }
      },
      { new: true }
    );

    console.log("Email verified successfully for:", updatedUser.email);
    console.log("User isVerified status:", updatedUser.isVerified);
    
    return res.json({ message: "Email verified successfully!" });

  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};




// FORGOT PASSWORD 
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "Email not found in our system" });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Update reset token directly in database to avoid triggering pre-save hooks
    await User.findOneAndUpdate(
      { _id: user._id },
      { 
        $set: { 
          resetPasswordToken: resetToken,
          resetPasswordExpires: Date.now() + 3600000 // 1 hour
        }
      }
    );

    // Send Email with error handling
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      res.status(200).json({ message: "Reset link sent to your email." });
    } catch (emailError) {
      console.error("Forgot password - Email sending error:", emailError);
      res.status(200).json({ 
        message: "Password reset token generated, but we couldn't send the email. Please contact support with your email address.",
        emailError: true
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// RESET PASSWORD

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, 
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = password; 
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful! You can now login." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// RESEND VERIFICATION EMAIL
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ 
        message: "If this email exists and is unverified, a new verification link has been sent." 
      });
    }

    if (user.isVerified) {
      return res.status(200).json({ message: "This account is already verified. You can log in." });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update verification token directly in database to avoid triggering pre-save hooks
    await User.findOneAndUpdate(
      { _id: user._id },
      { 
        $set: { 
          verificationToken: verificationToken,
          verificationTokenExpires: expiresAt
        }
      }
    );

    //console.log("Resend verification token:", verificationToken, "expiresAt:", expiresAt);

    try {
      await sendVerificationEmail(user.email, verificationToken);
      return res.status(200).json({ message: "A new verification email has been sent. Please check your inbox." });
    } catch (emailError) {
      console.error("Resend verification - Email sending error:", emailError);
      return res.status(200).json({ 
        message: "We couldn't send the verification email. Please try again later or contact support.",
        emailError: true
      });
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
