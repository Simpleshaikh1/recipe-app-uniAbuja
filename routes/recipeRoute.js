const express = require('express');
const router = express.Router();
// const {uploadProductImage} = require('../utils/uploadImage')
const {
  authenticateUsers,
  authorizePermissions,
} = require('../middleware/authentication');

const {
    createRecipe,
    getAllRecipe,
    getRecipeByName,
    updateRecipe,
    deleteRecipe,
    allRecipeBelongToUser,
} = require('../controllers/recipe.controller');

router
    .route("/post-recipe")
    .post(authenticateUsers, createRecipe);

router
    .route("/get-recipe")
    .get(authenticateUsers, authorizePermissions("user"), getAllRecipe);

router
    .route("/get-recipes-by-user")
    .get(authenticateUsers, authorizePermissions("user"), allRecipeBelongToUser);

router
    .route("/get-a-recipe/:recipeName")
    .get(authenticateUsers, getRecipeByName);
    
router
    .route('/delete-recipe/:recipeId')
    .delete(authenticateUsers, authorizePermissions("user"), deleteRecipe);

router
    .route('/update-recipe/:recipeId')
    .patch(authenticateUsers, authorizePermissions("user"), updateRecipe)



module.exports = router