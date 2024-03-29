const Recipe = require('../models/recipe.model');
const dotenv = require('dotenv');
const User = require('../models/User.model');
const {StatusCodes} = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');
const cloudinary = require('cloudinary').v2;

dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const createRecipe = async (req, res) => {
  try {

    if (req.files) {
      const path = req.files.recipeImage.tempFilePath;
      await cloudinary.uploader.upload(path, function (err, result) {
          if (err) {
            return console.log("error while uploading user profile image to server")
          }
          req.body.recipeImage = result.secure_url;
      });
    }

    const recipe = await Recipe.create({
      recipeImage: req.body.recipeImage || '',
      title: req.body.title,
      description: req.body.description,
      estimatedTime: req.body.estimatedTime,
      ingredients: req.body.ingredients,
      category: req.body.category,
      owner: req.user.userId,
    });

    res.status(201).json({
      msg: "Created",
      data: recipe,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Server error",
      error: error,
    });
  }
};

const getRecipeByName = async (req, res, next) => {

  try {
    const {recipeName} = req.params;

    const recipe = await Recipe.find({title: {$regex: recipeName, $options: 'i'}})
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'recipe found',
      recipe
    });
  } catch (error) {
    next(error);
  }
};


const getAllRecipe = async (req, res, next) => {
  // console.log(1)
  const { page = 1, limit = 10 } = req.query;

  try {
    const count = await Recipe.countDocuments();
    const recipe = await Recipe.find().skip((page - 1) * limit).limit(limit);

    if (recipe.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'No Recipe found'
      });
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'These are all Recipe',
      data: {
        recipe,
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};

const allRecipeBelongToUser = async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const userId = req.user.userId;

    console.log('UserId', req.user)
    const count = await Recipe.countDocuments({ owner: userId });
    const recipes = await Recipe.find({ owner: userId }).skip((page - 1) * limit).limit(limit);

    if (recipes.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'No Recipe found for the authenticated user'
      });
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'These are the Recipe created by the authenticated user',
      data: {
        recipes,
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};




const updateRecipe = async (req, res, next) => {
  try {
    const { recipeId } = req.params;
    const updateRecipe = await Recipe.findByIdAndUpdate(recipeId, req.body, { new: true });

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: ' Recipe have been updated',
      data: updateRecipe
    });
  } catch (error) {
    next(error);
  }
};



const deleteRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;
    console.log(recipeId)
    await Recipe.findByIdAndDelete(recipeId);

    res.status(204).json({
      status: 'Deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


module.exports = {
  createRecipe,
  getRecipeByName,
  getAllRecipe,
  updateRecipe,
  deleteRecipe,
  allRecipeBelongToUser
}