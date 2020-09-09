const path = require('path');
const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
// const cors = require('cors');
// const cookieSession = require('cookie-session')

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingsRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

dotenv.config({ path: './config.env' });
console.log(process.env.NODE_ENV);

// Development Logging

//@GLOBAL-MIDDLEWARE

// app.use(
//     cors({
//         origin: '*',
//         // credentials: true,
//         // optionsSuccessStatus: 200,
//     }),
// );

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serving statuc files
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!',
});

// Set security HTTP headers
app.use(helmet());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization from the Nosql query injection
app.use(mongoSanitize());

// Data sanitization from XSS
app.use(xss());

// For cross-origin proxy allow you to use cross origin proxy in server

// Prevent parameter polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Test Middleware
// let cookie;

app.use((req, res, next) => {
  // console.log(req.cookies);
  // cookie = req.cookies;

  next();
});

// IP limiter
app.use('/api', limiter);

// app.use(function (req, res, next) {
//     res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // update to match the domain you will make the request from
//     res.header(
//         'Access-Control-Allow-Headers',
//         'Origin, X-Requested-With, Content-Type, Accept',
//     );
//     next();
// });

//@ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/tour/api/v1/bookings', bookingRouter); // For Website
app.use('/api/v1/bookings', bookingRouter); // for API

app.all('*', (req, res, next) => {
  next(new AppError(`${req.originalUrl} Route not defined`, 404));
});

app.use(globalErrorHandler);

module.exports = app;