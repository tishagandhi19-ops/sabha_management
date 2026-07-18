import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true
  },
  arrivalTime: {
    type: Date // Exact date-time when marked present
  },
  isLate: {
    type: Boolean,
    default: false
  },
  remark: {
    type: String,
    default: ""
  }
});

// Ensure a member has only one attendance record per event
AttendanceSchema.index({ event: 1, member: 1 }, { unique: true });

export default mongoose.model('Attendance', AttendanceSchema);
