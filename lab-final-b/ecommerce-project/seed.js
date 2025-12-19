const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const products = [
    {
        name: "Wireless Headphones",
        description: "Premium wireless headphones with noise cancellation",
        price: 199.99,
        category: "Electronics",
        image: "/images/headphones.jpg",
        stock: 50
    },
    {
        name: "Smart Watch",
        description: "Fitness tracker with heart rate monitor",
        price: 299.99,
        category: "Electronics",
        image: "/images/watch.jpg",
        stock: 30
    },
    {
        name: "Coffee Maker",
        description: "Automatic coffee maker with timer",
        price: 89.99,
        category: "Home Appliances",
        image: "/images/coffee-maker.jpg",
        stock: 25
    },
    {
        name: "Backpack",
        description: "Water-resistant backpack with laptop compartment",
        price: 59.99,
        category: "Fashion",
        image: "/images/backpack.jpg",
        stock: 100
    },
    {
        name: "Bluetooth Speaker",
        description: "Portable speaker with 12-hour battery",
        price: 79.99,
        category: "Electronics",
        image: "/images/speaker.jpg",
        stock: 45
    },
    {
        name: "Desk Lamp",
        description: "LED desk lamp with adjustable brightness",
        price: 39.99,
        category: "Home",
        image: "/images/lamp.jpg",
        stock: 60
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Insert new products
        await Product.insertMany(products);
        console.log('Added sample products');

        mongoose.connection.close();
        console.log('Database seeding completed');
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();