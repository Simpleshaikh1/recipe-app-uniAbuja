const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Token = require('../models/Token.model');
const {StatusCodes} = require('http-status-codes');
const CustomError = require('../errors');
const otpGenerator = require('otp-generator');
const mongoose = require('mongoose');

const {
    attachCookiesToResponse,
    createTokenUser,
    sendVerificationEmail,
    sendResetPasswordEmail,
    createHash,
} = require('../utils');

const crypto = require('crypto');


// Resgister user with email and password

const register = async (req, res) => {
  try {
    let user,
      { email, password } = req.body;

    const emailAlreadyExist = await User.findOne({ email });
    if (emailAlreadyExist) {
      return res.status(400).send({
        responseCode: 400,
        status: 'exist',
        message: "User already registered"
      });
    }

    // first logged in user should be admin
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const role = isFirstAccount ? 'admin' : 'user';

    // const OTP = otpGenerator.generate(6, {
    //   digits: true,
    //   upperCaseAlphabets: false,
    //   specialChars: false,
    //   lowerCaseAlphabets: false,
    // });

    // const salt = await bcrypt.genSalt(10);
    // const hashedOTP = await bcrypt.hash(OTP, salt);

    const userOptions = {
      email,
      password,
      role,
      // otp: hashedOTP,
    };

    // Create both user and token in a single transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      user = await User.create([userOptions], { session });

      // const userTokenOptions = {
      //   // refreshToken: hashedOTP, 
      //   ip: 'example-ip',
      //   userAgent: 'example-user-agent',
      //   user: user[0]._id,
      // };

      // await Token.create([userTokenOptions], { session });

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
    // const origin = 'http://localhost:5000/api/v1'
    
    // await sendVerificationEmail({
    //   to: email,
    //   OTP: OTP,
    //   origin,
    // });
   
    res.status(StatusCodes.CREATED).json({
      email: user[0].email,
      msg: 'Success, please check your email to verify',
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      responseCode: 500,
      statu: 'failed',
      message: error.message
    });
  }
};



// Verify Email Route

const verifyEmail = async (req, res) =>{

    const { email} = req.body;

    const user = await User.findOne({email});

   
    if(!user){
      return res.status(400).send({
        responseCode: 400,
        status: 'failure',
        message: "User not found"
      });
    }

    // const otpRecord = await Token.findOne({user: user._id});

    // if (!otpRecord) {
    //   return res.status(400).send({
    //     responseCode: 400, 
    //     status: 'failure',
    //     message: "OTP record not found"
    //   });
    // }

    // const isOtpValid = await bcrypt.compare(token, otpRecord.refreshToken);

    // if (!isOtpValid) {
    //     return res.status(400).send({
    //         responseCode: 400,
    //         status: 'failure',
    //         message: "Invalid OTP"
    //     });
    // }

    (user.isVerified = true), (user.verified = Date.now());

    await user.save();

    // await Token.deleteOne({ user: user._id });

    res.status(StatusCodes.OK).json({ 
      msg: 'Email Verified' 
    });
};

// Login after email verification

//issue withh my login and logout to be resolved

const login = async (req, res, next) =>{

  try {
    const {email, password} = req.body;
    if(!email || !password){
      return res.status(400).send({
        responseCode: 400,
        status: "failure",
        message: "Please provide email and password"
      });
    }
    const user = await User.findOne({email});
    
    if(!user){
      return res.status(400).send({
        responseCode: 400,
        status: "failure",
        message: "User not found."
      });
    }
    
    const isPasswordCorrect = await user.comparePassword(password);
    if(!isPasswordCorrect){
      return res.status(400).send({
        responseCode: 400,
        status: "failure",
        message: "Invalid login credentials"
      });
    }
    
    if (!user.isVerified) {
      return res.status(400).send({
        responseCode: 400,
        status: "failure",
        message: "Please verify your email to login."
      });
    }
    let tokenUser = createTokenUser(user);
    
    let  refreshToken = '';
  
    const existingToken = await Token.findOne({user: user._id});
   
    if(existingToken){
      const {isValid} = existingToken;
      if(!isValid){
        return res.status(400).send({
          responseCode: 400,
          status: "failure",
          message: "Please use a valid token"
        });
      }
      refreshToken = existingToken.refreshToken;
      attachCookiesToResponse({res,  user: tokenUser, refreshToken });
      //where cant set header bug is
      res.status(StatusCodes.OK).json({user: tokenUser});
      return;
    }
    
  refreshToken = crypto.randomBytes(40).toString('hex');
  const userAgent = req.headers['user-agent'];
  const ip = req.ip;
  const userToken = { refreshToken, ip, userAgent, user: user._id };

  await Token.create(userToken);

  attachCookiesToResponse({ res, user: tokenUser, refreshToken });
    res.status(StatusCodes.OK).json({ user: tokenUser });

    return next();
   
  } catch (error) {
    next(error);
  }

};

//Logout Route

const logout = async (req, res) => {

  await Token.findOneAndDelete({ user: req.user.userId });
  
  res.cookie('accessToken', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  
  // console.log('logout')
    res.cookie('refreshToken', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now()),
    });
    res.status(StatusCodes.OK).json({ msg: 'user logged out!' });
};

//FOrgot Password Route

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(404).send({
        message: "This email does not exist on Credence."
      });
    }
  
    const user = await User.findOne({ email });
  
    const passwordToken = crypto.randomBytes(70).toString('hex');
    if (user) {

      // send email

    // const origin = 'http://localhost:5000';
    // await sendResetPasswordEmail({
    //   email: user.email, 
    //   token: passwordToken,
    //   origin,
    // });
      
    
      const tenMinutes = 1000 * 60 * 10;
      const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

  
      user.passwordToken = createHash(passwordToken);
      user.passwordTokenExpirationDate = passwordTokenExpirationDate;
      await user.save();
      // console.log(2)
    }
  
    res
      .status(StatusCodes.OK)
      .json({ msg: 'Please check your email for reset password link', token:passwordToken});

};

//Reset Password Route

const resetPassword = async ({body}, res) => {
    const { token, password, email } = body;
    if (!token ||  !password) {
      return res.status(404).send({
        message: "Please provide token and password"
      });
    }
    const user = await User.findOne({ email });
  
    if (user) {
      const currentDate = new Date();
  
      if (
        user.passwordToken === createHash(token) &&
        user.passwordTokenExpirationDate > currentDate
      ) {
        user.password = password;
        user.passwordToken = null;
        user.passwordTokenExpirationDate = null;
        await user.save();
      }
    }
  
    res.status(StatusCodes.OK).json('Password reset successfully');
};


module.exports = {
    register,
    login,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
  };


