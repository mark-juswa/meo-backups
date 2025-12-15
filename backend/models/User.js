import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },

    first_name: {
      type: String,
      required: true,
    },

    last_name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone_number: {
      type: Number,
      required: true,
    },

    role: {
      type: String,
      enum: ["meoadmin", "bfpadmin", "mayoradmin", "user"],
      default: "user",
    },

    profileImage: {
      type: String,
      default: "",
    },

    profileImageType: {
      type: String,
      default: "",
    },


    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },

    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  console.log("=== PRE-SAVE HOOK TRIGGERED ===");
  console.log("Password modified:", this.isModified("password"));
  console.log("Current password value:", this.password);
  console.log("Password length:", this.password?.length);
  
  if (!this.isModified("password")) {
    console.log("Password not modified, skipping hash");
    return next();
  }
  
  try {
    console.log("Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const originalPassword = this.password;
    this.password = await bcrypt.hash(this.password, salt);
    console.log("Password hashed successfully!");
    console.log("Original password:", originalPassword);
    console.log("Hashed password:", this.password);
    next();
  } catch (error) {
    console.error("Error in pre-save hook:", error);
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
