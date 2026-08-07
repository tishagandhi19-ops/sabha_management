import mongoose from 'mongoose';

const SevaMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['bal', 'kisori', 'yuvti', 'prutha', 'vadil'],
    required: true
  },
  uniqueCode: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('SevaMember', SevaMemberSchema);

