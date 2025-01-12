const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    weight: {
        type: Number,
        required: true,
        min: 0
    },
    dimensions: {
        length: { type: Number, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true }
    },
    pickup: {
        address: { type: String, required: true },
        date: { type: Date, required: true }
    },
    delivery: {
        address: { type: String, required: true },
        date: { type: Date, required: true }
    },
    distance: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: [
            'active',             
            'assigned',           
            'heading_to_pickup',  
            'waiting_for_pickup', 
            'picked_up',         
            'in_transit',        
            'at_delivery',       
            'delivered',         
            'cancelled'          
        ],
        default: 'active'
    },
    spedytorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);