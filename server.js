const mangoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

// @CATCHING-ERROR

process.on('uncaughtException', err => {
  process.exit(1);
});

dotenv.config({ path: './config.env' });

// Development logging

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

const mangoos = async () => {
  // eslint-disable-next-line no-unused-vars
  const data = await mangoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });
};

mangoos();

/**
 * @SERVER
 */

// const expire = new Date(Date.now() + parseInt(process.env.COOKIE_EXPIRE, 10));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {});

process.on('unhandledRejection', err => {
  server.close(() => {
    process.exit(1);
  });
});

// function capital_letter(str) {
//     str = str.split(' ');

//     for (let i = 0, x = str.length; i < x; i++) {
//         str[i] = str[i][0].toUpperCase() + str[i].substr(1);
//     }

//     return str.join(' ');
// }

// const name = ['the', 'forest', 'hiker'];
// let save = [];
// const check = name.forEach((el, index) => {
//     save[index] = el[0].toUpperCase() + el.substr(1).toLowerCase();
// });
