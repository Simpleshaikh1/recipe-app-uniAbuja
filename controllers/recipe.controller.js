const Recipe = require('../models/recipe.model');
const User = require('../models/User.model');
const {StatusCodes} = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path')


const createRecipe = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({
        msg: "No Image uploaded",
      });
    }

    const image = req.files.recipeImage;

    if (!image.mimetype.startsWith("image/png")) {
      return res.status(400).json({
        msg: "upload image with .png extension",
      });
    }

    const maxSize = 1024 * 1024;

    if (image.size > maxSize) {
      return res.status(400).json({
        msg: "upload image smaller than 1MB",
      });
    }

    const imagePath = path.join(__dirname, "../public", image.name);
    await image.mv(imagePath);

    const recipe = await Recipe.create({
      recipeImage: imagePath,
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