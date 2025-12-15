// backend/routes/events.js
import express from 'express';
import { verifyToken, verifyRole } from '../middleware/authMiddleware.js';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventController.js';

const router = express.Router();

// Public GET
router.get('/', verifyToken, getEvents);

// Admin-only create/edit/delete
// change role as needed (meoadmin, bfpadmin, mayoradmin)
router.post('/', verifyToken, verifyRole('meoadmin'), createEvent);
router.put('/:id', verifyToken, verifyRole('meoadmin'), updateEvent);
router.delete('/:id', verifyToken, verifyRole('meoadmin'), deleteEvent);

export default router;
