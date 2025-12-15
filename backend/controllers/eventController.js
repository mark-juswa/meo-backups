
import Event from '../models/Event.js';
import mongoose from 'mongoose';

// GET /api/events
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'first_name last_name email');
    return res.json({ success: true, events });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/events
export const createEvent = async (req, res) => {
  try {
    const { title, description, start, end, location } = req.body;
    if (!title || !start || !end) {
      return res.status(400).json({ success: false, message: 'Title/start/end required' });
    }
    const event = new Event({
      title,
      description,
      start: new Date(start),
      end: new Date(end),
      location,
      createdBy: req.user?.id || null,
    });
    await event.save();
    return res.status(201).json({ success: true, event });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/events/:id
export const updateEvent = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const { title, description, start, end, location } = req.body;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    event.title = title ?? event.title;
    event.description = description ?? event.description;
    event.start = start ? new Date(start) : event.start;
    event.end = end ? new Date(end) : event.end;
    event.location = location ?? event.location;
    event.updatedAt = Date.now();

    await event.save();
    return res.json({ success: true, event });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/events/:id
export const deleteEvent = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const event = await Event.findByIdAndDelete(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    return res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
