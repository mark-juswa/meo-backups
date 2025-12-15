import { parse } from "dotenv";
import User from "../models/User.js";

export const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;
        const total = await User.countDocuments();

        const users = await User.find().skip(skip).limit(limit).select("-password");

        res.status(200).json({
            users,
            total,
            page,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
            

    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        await User.findByIdAndDelete(req.params.id); 

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ message: "Server error" });
    }
};


export const getProfile = async (req, res) => {
  try {
    console.log("Decoded user from token:", req.user);

    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      console.log("User not found for ID:", req.user.userId);
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
      profileImage: user.profileImage,
      profileImageType: user.profileImageType,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ message: "Role updated", user });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.first_name = req.body.first_name || user.first_name;
    user.last_name = req.body.last_name || user.last_name;
    user.phone_number = req.body.phone_number || user.phone_number;

    // If image uploaded
    if (req.file) {
      user.profileImage = req.file.buffer.toString("base64");
      user.profileImageType = req.file.mimetype;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Update failed" });
  }
};


export const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("+password");
    const { oldPassword, newPassword } = req.body;

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return res.status(400).json({ message: "Incorrect old password" });

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ message: "Password change failed" });
  }
};
