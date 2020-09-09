const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'user must provide a name'],
    maxlength: [20, 'Name must have less or equal to 20 characters'],
    minlength: [5, 'Name must have more or equal to 5 characters'],
  },
  email: {
    type: String,
    trim: true,
    unique: [true, 'Email in use'],
    required: [true, 'user must provide a email'],
    lowercase: true,
    validate: [validator.isEmail, 'please provide valid email.'],
  },
  passwordChangeDate: Date,
  password: {
    type: String,
    required: [true, 'please provide password'],
    trim: true,
    minlength: [8, 'password must be more or equal to 8 characters'],
    select: false,
  },
  passwordConfirmation: {
    type: String,
    trim: true,
    required: [true, 'please provide confirm password'],
    validate: {
      // THIS ONLY WORKS ON CREATE AND SAVE
      validator: function (val) {
        return val === this.password;
      },
      message: 'password must match',
    },
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre(/^find/, function (next) {
  // this points to current query
  this.find({ active: { $ne: false } });

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangeDate = Date.now() - 1000;

  next();
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirmation = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePassword = function (JWTTimeStamp) {
  if (this.passwordChangeDate) {
    const timeStamp = parseInt(this.passwordChangeDate.getTime() / 1000, 10);

    return JWTTimeStamp < timeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
