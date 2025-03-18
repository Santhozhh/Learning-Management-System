const mongoose = require('mongoose');
const { Schema } = mongoose;

const MaterialSchema = new Schema({
    title: { type: String, required: true },
    type: { type: String, required: true }
});

const AssignmentSchema = new Schema({
    title: { type: String, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["Pending", "In Progress", "Completed", "Submitted"], required: true }
});

const NotificationSchema = new Schema({
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

const StudentSchema = new Schema({
    // Registration Information
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    rollNo: { type: String, required: true, unique: true },
    regNo: { type: String, required: true, unique: true },
    dateOfBirth: { type: Date, required: true },
    department: { type: String, required: true },
    section: { type: String, default: 'A' },
    mobileNo: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid 10-digit mobile number!`
        }
    },
    mentorName: { type: String, default: 'Not Assigned' },
    classIncharge: { type: String, default: 'Not Assigned' },
    batch: { type: String, default: new Date().getFullYear().toString() },
    year: { type: String, required: true },
    classes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    }],
    
    // Dashboard Information
    materials: { type: [MaterialSchema], default: [] },
    assignments: { type: [AssignmentSchema], default: [] },
    notifications: { type: [NotificationSchema], default: [] },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now }
});

// Create the model only if it hasn't been registered
module.exports = mongoose.models.Student || mongoose.model('Student', StudentSchema);