import mongoose from 'mongoose';

const SevaAttendanceSchema = new mongoose.Schema({
  seva: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seva',
    required: true
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SevaMember',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true
  },
  hours: {
    type: Number,
    default: 0
  }
});

// Ensure a member has only one attendance record per seva
SevaAttendanceSchema.index({ seva: 1, member: 1 }, { unique: true });

export default mongoose.model('SevaAttendance', SevaAttendanceSchema);
