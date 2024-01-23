require("dotenv").config()

module.exports = {
    auth: {
      user: process.env.EMAIL_SENDER_ADDRESS,
      pass: process.env.MAILGUN_API_KEY,
    },
    
  };