const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  // host:'smtp.gmail.com',
  // port : 587,
  service:'gmail',
  secure : false,
  
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = transporter;
