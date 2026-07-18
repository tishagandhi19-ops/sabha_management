import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['kishor', 'yuva', 'proudh', 'vadil'],
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

export default mongoose.model('Member', MemberSchema);
