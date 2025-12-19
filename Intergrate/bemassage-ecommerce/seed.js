const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const sampleProducts = [
    {
        name: "CLASSIC MASSAGE",
        price: 39,
        originalPrice: 49,
        category: "classic",
        image: "classic.jpg",
        description: "Mauris in erat justo. Nullam ac urna eu felis dapibus condimentum sit amet a augue.",
        duration: 60,
        featured: true
    },
    {
        name: "MUSCLE MENDER MASSAGE",
        price: 29,
        originalPrice: 35,
        category: "muscle",
        image: "muscle.jpg",
        description: "Mauris in erat justo. Nullam ac urna eu felis dapibus condimentum sit amet a augue.",
        duration: 45,
        featured: true
    },
    {
        name: "CHAKRA ENERGY MASSAGE",
        price: 25,
        originalPrice: 30,
        category: "chakra",
        image: "chakra.jpg",
        description: "Mauris in erat justo. Nullam ac urna eu felis dapibus condimentum sit amet a augue.",
        duration: 50,
        featured: true
    },
    {
        name: "DE-STRESS MASSAGE",
        price: 45,
        originalPrice: 55,
        category: "destress",
        image: "destress.jpg",
        description: "Mauris in erat justo. Nullam ac urna eu felis dapibus condimentum sit amet a augue.",
        duration: 75,
        featured: true
    },
    {
        name: "TRADITIONAL MASSAGE",
        price: 20,
        originalPrice: 25,
        category: "traditional",
        image: "massage.jpg",
        description: "Mauris in erat justo. Nullam ac urna eu felis dapibus condimentum sit amet a augue.",
        duration: 30,
        featured: false
    }
];

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(async () => {
        console.log('Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Insert sample products
        await Product.insertMany(sampleProducts);
        console.log('Sample products inserted');

        mongoose.connection.close();
        console.log('Database seeding completed');
    })
    .catch(err => {
        console.error('Error seeding database:', err);
        mongoose.connection.close();
    });