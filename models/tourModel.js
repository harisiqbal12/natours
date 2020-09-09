const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
/**
 * @SCHEMA
 */

const tourScheme = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: true,
            trim: true,
            required: [true, 'A tour must have a name'],
            maxlength: [
                40,
                'Tour name must have have less or equal than 40 charac',
            ],
            minlength: [10, 'Tour must have more or equal to 10 charac'],
        },
        slug: {
            type: String,
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
            set: val => Math.round(val * 10) / 10,
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, 'tour must have a price'],
        },
        duration: {
            type: Number,
            require: [true, 'Tour must have a duration'],
        },
        maxGroupSize: {
            type: Number,
            require: [true, 'Tour must have a group size'],
        },
        difficulty: {
            type: String,
            require: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is either: easy, medium diffiult',
            },
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (val) {
                    // This only points to curent doc on NEW document creation
                    return val < this.price;
                },
                message:
                    'Discount price ({VALUE}) must be less than a price value',
            },
        },
        summary: {
            type: String,
            trim: true,
            require: [true, 'Tour must have a summary'],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            require: [true, 'Tour must have a cover image'],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false,
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false,
        },
        startLocation: {
            //GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number],
            address: String,
            description: String,
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                address: String,
                day: Number,
            },
        ],
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

// tourScheme.index({ price: 1 });
tourScheme.index({ price: 1, ratingsAverage: -1 });
tourScheme.index({ slug: 1 });
tourScheme.index({ startLocation: '2dsphere' });

tourScheme.virtual('durationWeeks').get(function () {
    // console.log(this.duration / 7);
    return this.duration / 7;
});

// Virtual populate
tourScheme.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id',
});

/**
 * @DOCUMENTMIDDLEWARE
 * run before .save() and .create()
 * so can only availabe for save and create

 
 tourScheme.pre('save', function(next) {
     console.log('will save document...')
     
     next();
     
    })
tourScheme.post('save', function(doc, next) {
    console.log(doc)
        
    next();
});
*/

// QUERY-MIDDLEWARE

// tourScheme.pre('save', async function(next) {
//     const guidesPromise = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromise);
//     next();
// });

tourScheme.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });

    next();
});

// tourScheme.pre('find', function (next) {
tourScheme.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });

    this.start = Date.now();
    next();
});

tourScheme.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select:
            '-__v -passwordChangeDate -passwordResetExpires -passwordResetToken',
    });

    next();
});

tourScheme.post(/^find/, function (doc, next) {
    console.log(`query took ${Date.now() - this.start} miliseconds`);

    next();
});
/**
 * @AGGREGATIONMIDDLEWARE
 */

// tourScheme.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//     next();
// });

const Tour = mongoose.model('Tour', tourScheme);

module.exports = Tour;
