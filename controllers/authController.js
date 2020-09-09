const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

// @MIDDLWARE-FUNCTIONS

const signToken = userId => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOption = {
    expires: new Date(
      Date.now() +
        parseInt(process.env.COOKIE_EXPIRE, 10) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    // secure: true,
    // sameSite: 'none',
  };
//   if (process.env.NODE_ENV === 'production') {
//     cookieOption.secure = true;
//   }

  res.cookie('jwt', token, cookieOption);

  // Remove the password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 100 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirmation: req.body.passwordConfirm,
    role: req.body.role,
    photo: req.body.photo,
    // passwordChangeDate: req.body.passwordChangeDate,
    // passwordResetToken: req.body.passwordResetToken,
    // passwordResetExpires: req.body.passwordResetExpires,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // CHECK IF EMAIL AND PASSWORD EXISTS
  if (!email || !password) {
    return next(
      new AppError('Please provide email and password to login.', 400),
    );
  }

  // CHECK OF THE USER EXIST AND PASSWORD IS CORRECT
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or password', 401));
  }

  // IF EVERYTHING OK, SEND BACK THE TOKEN
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // GETTING TOKEN AND CHECN IF ITS THERE.
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! please log in to get access', 401),
    );
  }

  // VARIFICATION TOKEN.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // CHECK IF USER STILL EXISTS.
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('Invalid Token, Token no longer exists.', 401));
  }
  // CHECK IF USER CHANGE PASSWORD AFTER THE tokken ISSUED.

  if (freshUser.changePassword(decoded.iat)) {
    return next(new AppError('User Recently changed Password!', 401));
  }

  // Access granted for protected route
  req.user = freshUser;

  res.locals.user = freshUser;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    // Verify token
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // CHECK IF USER STILL EXISTS.
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }

      // CHECK IF USER CHANGE PASSWORD AFTER THE tokken ISSUED.

      if (freshUser.changePassword(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER.
      res.locals.user = freshUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
});

exports.ristrictTo = (...roles) => {
  return (req, res, next) => {
    // roles in a array.

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You dont have permission to forbidden this role.', 403),
      );
    }

    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // Get user based on POSTED email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('There is no user associated with this email!', 404),
    );
  }

  // Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send it to user email

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'password reset link send to your email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'Error occured during sending the mail. try again later.',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // if token has not expired, and there is user, set new password
  if (!user) {
    return next(new AppError('Invalid Token or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirmation = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  const { passwordCurrent, password, passwordConfirm } = req.body;
  // Check if POSTed current password is correct
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError('Incorrect Password try again', 401));
  }

  // If so update password
  user.password = password;
  user.passwordConfirmation = passwordConfirm;
  await user.save();

  // Log user in, send JWT
  createSendToken(user, 200, res);
});
