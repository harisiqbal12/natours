const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.ristrictTo('user'),
        reviewController.setTourUserId,
        reviewController.createReview,
    );

router
    .route('/:id')
    .delete(
        authController.ristrictTo('user', 'admin'),
        reviewController.deleteReview,
    )
    .patch(
        authController.ristrictTo('user', 'admin'),
        reviewController.updateReview,
    )
    .get(reviewController.getReview);

// Exporting router

module.exports = router;
