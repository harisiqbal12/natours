const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatues = require('../utils/apiFeatures');

exports.deleteOne = Model =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc) {
            return next(new AppError('Tour not found', 404));
        }

        res.status(200).json({
            tatus: 'success',
            message: 'field deleted',
        });
    });

exports.updateOne = Model =>
    catchAsync(async (req, res, next) => {
        const updateDoc = await Model.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            },
        );

        if (!updateDoc) {
            next(new AppError(`No Document found With this id`, 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: updateDoc,
            },
        });
    });

exports.createOne = Model =>
    catchAsync(async (req, res, next) => {
        const newDoc = await Model.create(req.body);
        res.status(200).json({
            status: 'success',
            data: {
                data: newDoc,
            },
        });
    });

exports.getOne = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (popOptions) query = query.populate(popOptions);

        const doc = await query;

        if (!doc) {
            return next(new AppError(`Data not found`, 404));
        }
        res.status(200).json({
            status: 'success',
            data: {
                doc,
            },
        });
    });

exports.getAll = Model =>
    catchAsync(async (req, res, next) => {
        // To allow for nested get reviews on tour
        let filter;
        if (req.params.tourId) filter = { doc: req.params.tourId };
        const features = new APIFeatues(Model.find(filter), req.query)
            .filter()
            .sort()
            .limit()
            .paginate();

        // const doc = await features.query.explain();
        const doc = await features.query;

        // SEND RESPONSE
        res.status(200).json({
            status: 'success',
            result: doc.length,
            data: {
                data: doc,
            },
        });
    });
