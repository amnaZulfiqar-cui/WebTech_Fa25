const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    customerEmail: {
        type: String,
        required: [true, 'Customer email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    customerName: {
        type: String,
        trim: true,
        default: ''
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    shipping: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    discountCode: {
        type: String,
        trim: true,
        uppercase: true
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Placed'
    },
    paymentMethod: {
        type: String,
        enum: ['Credit Card', 'PayPal', 'Cash on Delivery', 'Bank Transfer'],
        default: 'Credit Card'
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    deliveredAt: {
        type: Date
    }
});

// Generate order ID before saving
orderSchema.pre('save', function (next) {
    if (!this.orderId) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.orderId = `ORD-${timestamp}-${random}`;
    }

    // Update timestamp
    this.updatedAt = Date.now();

    // Set deliveredAt timestamp if status changed to Delivered
    if (this.isModified('status') && this.status === 'Delivered' && !this.deliveredAt) {
        this.deliveredAt = new Date();
    }

    next();
});

// Virtual for formatted dates
orderSchema.virtual('formattedDate').get(function () {
    return this.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

orderSchema.virtual('formattedTotal').get(function () {
    return `$${this.total.toFixed(2)}`;
});

// Static method to find orders by email
orderSchema.statics.findByEmail = function (email) {
    return this.find({ customerEmail: email.toLowerCase() })
        .sort({ createdAt: -1 })
        .populate('items.productId');
};

// Static method to get order summary
orderSchema.statics.getSummary = async function (email) {
    const orders = await this.find({ customerEmail: email });

    const summary = {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
        pendingOrders: orders.filter(order => order.status === 'Placed' || order.status === 'Processing').length,
        deliveredOrders: orders.filter(order => order.status === 'Delivered').length
    };

    return summary;
};

// Instance method to calculate item count
orderSchema.methods.getItemCount = function () {
    return this.items.reduce((total, item) => total + item.quantity, 0);
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;