const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  recipeImage: {
    type: String,
    // required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  estimatedTime: {
    type: String,
    required: true,
  },
  ingredients: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['main meal', 'appetizer', 'dessert'],
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  isTrash: {
    type: Boolean,
    default: false,
    select: false,
  },
});

recipeSchema.pre(/^find/, function (next) {
  this.find({ isTrash: { $ne: true } });
  next();
});

module.exports = mongoose.model('Recipe', recipeSchema);
