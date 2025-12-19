const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative'],
        set: v => parseFloat(v.toFixed(2))
    },
    category: {
        type: String,
        required: [true, 'Product category is required'],
        trim: true,
        enum: ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Other']
    },
    image: {
        type: String,
        default: 'https://via.placeholder.com/300x200?text=No+Image',
        validate: {
            validator: function (v) {
                return /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/.test(v) || v.startsWith('/');
            },
            message: 'Please provide a valid image URL'
        }
    },
    stock: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp before saving
productSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function () {
    return `$${this.price.toFixed(2)}`;
});

// Static method to get products by category
productSchema.statics.findByCategory = function (category) {
    return this.find({ category: new RegExp(category, 'i') });
};

// Instance method to check availability
productSchema.methods.isAvailable = function (quantity = 1) {
    return this.stock >= quantity;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;