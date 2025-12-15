import multer from "multer";
import path from "path";
import fs from "fs";

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Storage for Documents (PDF, DOC, DOCX, Images) - Using memory storage for Base64 conversion
const docStorage = multer.memoryStorage();

export const documentUpload = multer({
    storage: docStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "application/pdf",
            "application/msword", 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
            "image/jpeg",
            "image/png",
            "image/jpg"
        ];
        
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only PDF, Word, and Image files are allowed."));
        }
        cb(null, true);
    }
});

// Storage for payment proofs 
const imageStorage = multer.memoryStorage();

export const imageUpload = multer({
    storage: imageStorage,
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/jpg"];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error("Only JPG, JPEG, PNG images allowed."));
        }
        cb(null, true);
    }
});


const profileStorage = multer.memoryStorage();

export const profileUpload = multer({
    storage: profileStorage,
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/jpg"];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error("Only JPG, JPEG, PNG images allowed."));
        }
        cb(null, true);
    }
});
