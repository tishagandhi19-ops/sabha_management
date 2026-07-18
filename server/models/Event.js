import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['savar_ni_katha', 'ravi_sabha'],
    required: true
  },
  minReachTime: {
    type: String, // format "HH:MM", e.g., "08:00"
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Event', EventSchema);
