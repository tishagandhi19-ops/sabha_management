import mongoose from 'mongoose';

const SevaSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  sevaType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SevaType',
    required: true
  },
  leader: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Seva', SevaSchema);
