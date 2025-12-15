import express from 'express';
import { verifyRole, verifyToken } from '../middleware/authMiddleware.js';
import { deleteUser, getProfile, getUsers, updateUserRole, updateProfile, changePassword } from '../controllers/userController.js';
import { profileUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, verifyRole("meoadmin"), getUsers);
router.delete("/:id", verifyToken, verifyRole("meoadmin"), deleteUser);
router.put("/:id/role", verifyToken, verifyRole("meoadmin"), updateUserRole);

router.get("/me", verifyToken, getProfile);
router.put("/me", verifyToken, profileUpload.single("profileImage"), updateProfile);
router.put("/change-password", verifyToken, changePassword);

export default router;