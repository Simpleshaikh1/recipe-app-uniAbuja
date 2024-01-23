require("dotenv").config()
const nodeMailer = require('nodemailer');
const mailgunTransport = require("nodemailer-mailgun-transport");
const nodemailerConfig = require('./nodemailerConfig');


const sendEmail = async({to, subject, html}) =>{
    const transporter = nodeMailer.createTransport(mailgunTransport(nodemailerConfig));
    console.log('email')
    return transporter.sendMail({
        from: '"Recipe" <Sultan@Recipe.com>',
        to,
        subject,
        html
    });
};

module.exports = sendEmail;