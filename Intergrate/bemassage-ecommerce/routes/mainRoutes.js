const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');

// Home Page
router.get('/', mainController.getHomePage);

// Treatments Page with Pagination and Filters
router.get('/treatments', mainController.getTreatmentsPage);

// Checkout Page
router.get('/checkout', mainController.getCheckoutPage);
router.post('/checkout', mainController.postCheckout);

// Booking Confirmation
router.get('/booking', mainController.getBookingPage);

// About Page
router.get('/about', mainController.getAboutPage);

module.exports = router;