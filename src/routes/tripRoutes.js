const express = require('express');
const tripController = require('../controllers/tripController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ============================================
// TRIP ROUTES (All authenticated users can access)
// ============================================

// Create Trip
router.post('/', authMiddleware, tripController.createTrip);

// Get All Trips
router.get('/', authMiddleware, tripController.getAllTrips);

// Get Trip by ID
router.get('/:tripId', authMiddleware, tripController.getTripById);

// Get Trips by Driver ID
router.get('/driver/:driverId', authMiddleware, tripController.getTripsByDriver);

// Update Trip
router.put('/:tripId', authMiddleware, tripController.updateTrip);

// Delete Trip
router.delete('/:tripId', authMiddleware, tripController.deleteTrip);

// Get Car Revenue Statistics
router.get('/stats/revenue', authMiddleware, tripController.getCarRevenueStats);

module.exports = router;
