import mongoose from 'mongoose';

const SevaMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['kisori', 'yuvti', 'prutha', 'vadil'],
    required: true
  },
  uniqueCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('SevaMember', SevaMemberSchema);
