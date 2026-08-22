import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  nameEn: {
    type: String,
    trim: true,
    index: true
  },
  type: {
    type: String,
    enum: ['bal', 'kishor', 'yuva', 'proudh', 'vadil'],
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

export default mongoose.model('Member', MemberSchema);

