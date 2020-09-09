const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();
router.param('id', (req, res, next, val) => {
    next();
});

router.use('/:tourId/reviews', reviewRouter)

router
    .route('/monthly-plan/:year')
    .get(
        authController.protect, 
        authController.ristrictTo('admin', 'lead-guide', 'guide'), 
        tourController.getMonthlyPlan
    );

router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTours,  
        tourController.getAllTours
    );

router
    .route('/tour-stats')
    .get(tourController.getTourStats);

router.route(
    '/tours-within/:distance/center/:lating/unit/:unit')
    .get(tourController.getToursWithin
    );
// /tours-distance?distance=233&center=-40,40&unit=km
// tours-distance/233/center/-40,45/unit/km


router.route(
    '/distances/:lating/unit/:unit')
    .get(tourController.getDistances
    );

router
    .route('/')
    .get(tourController.getAllTours)
    .post(
        authController.protect, 
        authController.ristrictTo('admin', 'lead-guide' ), 
        tourController.postTour
    );

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(
        authController.protect, 
        authController.ristrictTo('admin', 'lead-guide'), 
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.patchTour
    )
    .delete(
        authController.protect,
        authController.ristrictTo('admin', 'lead-guide'),
        tourController.deleteTour,
    );




module.exports = router;
