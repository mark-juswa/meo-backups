
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const EventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  location: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

EventSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default model('Event', EventSchema);
