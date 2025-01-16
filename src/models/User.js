const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    role: { type: String, enum: ['kierowca', 'zleceniodawca', 'spedytor'], required: true },
    isOnline: { type: Boolean, default: false },
    spedytorIds: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    }],
    pendingInvitations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invitation',
        
    }],
    subscribedUrls: [{
        type: String,
        default: []
    }]
});

// Przerobić potem żeby hashowanie było client side
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

module.exports = mongoose.model('User', userSchema);