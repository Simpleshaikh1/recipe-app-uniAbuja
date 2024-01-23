const sendEmail = require('./sendEmail');
const nodeMailerMailgun = require('nodemailer-mailgun-transport');
const nodemailer = require('nodemailer')

const auth = {
  auth: {
      api_key: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN,
  },
};
let transporter = nodemailer.createTransport(nodeMailerMailgun(auth));


const sendVerificationEmail = async ({
  to,
  OTP,
}) => {
  const verifyEmail = `${OTP}`;
  const message = `<p>Please confirm your email by copying the otp: ${verifyEmail}`;

  const mailOptions = {
    from: {
      name: process.env.EMAIL_SENDER_NAME,
      address: process.env.EMAIL_SENDER_ADDRESS,
    },
    to,
    subject: "Complete your registration",
    html: `<h4> Hello, ${to}</h4>
    ${message}
    `,
  };
  try {
    const send = await transporter.sendMail(mailOptions, function(error, data){
        if(error){
            console.log(error)
        }else{
            console.log('mailgun working!!')
        }
    });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = sendVerificationEmail;
