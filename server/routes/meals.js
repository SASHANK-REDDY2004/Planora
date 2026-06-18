const express = require('express');
const router = express.Router();

const mealDatabase = [
  // Healthy Category
  {
    id: "h1",
    name: "Quinoa Salad with Chickpeas",
    category: "healthy",
    prepTime: "15 mins",
    ingredients: ["Quinoa", "Canned Chickpeas", "Cucumber", "Cherry Tomatoes", "Olive Oil", "Lemon Juice"],
    instructions: "Rinse and cook quinoa. Mix with drained chickpeas and chopped cucumber and tomatoes. Drizzle with olive oil and fresh lemon juice."
  },
  {
    id: "h2",
    name: "Baked Garlic Herb Salmon",
    category: "healthy",
    prepTime: "20 mins",
    ingredients: ["Salmon Fillet", "Broccoli Florets", "Garlic Minced", "Olive Oil", "Lemon Slices", "Dill"],
    instructions: "Place salmon and broccoli on a baking sheet. Drizzle with olive oil, rub with garlic, top with lemon slices, and bake at 400°F (200°C) for 12-15 mins."
  },
  {
    id: "h3",
    name: "Hearty Lentil Soup",
    category: "healthy",
    prepTime: "30 mins",
    ingredients: ["Brown Lentils", "Carrots", "Celery", "Onion", "Vegetable Broth", "Canned Diced Tomatoes"],
    instructions: "Sauté chopped onion, carrot, and celery. Add lentils, broth, and tomatoes. Simmer on medium-low for 25 minutes until lentils are tender."
  },
  {
    id: "h4",
    name: "Avocado Toast with Poached Egg",
    category: "healthy",
    prepTime: "10 mins",
    ingredients: ["Whole Wheat Bread", "Avocado", "Egg", "Red Pepper Flakes", "Salt & Pepper"],
    instructions: "Toast the bread. Mash avocado with salt, pepper, and spread it on toast. Poach or fry the egg and place on top, sprinkling red pepper flakes."
  },
  {
    id: "h5",
    name: "Berry Greek Yogurt Parfait",
    category: "healthy",
    prepTime: "5 mins",
    ingredients: ["Greek Yogurt", "Mixed Berries (Fresh/Frozen)", "Honey", "Granola", "Chia Seeds"],
    instructions: "Layer Greek yogurt, berries, and granola in a glass. Drizzle honey and sprinkle chia seeds on top."
  },
  {
    id: "h6",
    name: "Grilled Chicken & Asparagus",
    category: "healthy",
    prepTime: "20 mins",
    ingredients: ["Chicken Breast", "Asparagus spears", "Garlic Powder", "Paprika", "Olive Oil"],
    instructions: "Season chicken with garlic, paprika, salt, and pepper. Grill chicken and asparagus with olive oil until cooked through (chicken internal temp 165°F)."
  },

  // Quick Category
  {
    id: "q1",
    name: "10-Minute Egg Fried Rice",
    category: "quick",
    prepTime: "10 mins",
    ingredients: ["Pre-cooked/Leftover Rice", "Eggs", "Green Onions", "Soy Sauce", "Sesame Oil", "Frozen Peas & Carrots"],
    instructions: "Heat sesame oil in pan. Scramble eggs, push aside. Sauté veggies and green onions. Toss in rice and soy sauce, stirring on high heat for 3 mins."
  },
  {
    id: "q2",
    name: "Creamy Basil Pesto Pasta",
    category: "quick",
    prepTime: "12 mins",
    ingredients: ["Pasta (Penne or Spaghetti)", "Prepared Basil Pesto", "Cherry Tomatoes", "Parmesan Cheese"],
    instructions: "Boil pasta. Drain, reserving a bit of pasta water. Toss pasta with pesto, halved cherry tomatoes, and a splash of reserved water. Top with parmesan."
  },
  {
    id: "q3",
    name: "Classic Tuna Salad Sandwich",
    category: "quick",
    prepTime: "8 mins",
    ingredients: ["Canned Tuna", "Mayonnaise", "Celery Chopped", "Whole Wheat Bread", "Lettuce"],
    instructions: "Drain tuna and mix with mayonnaise, chopped celery, salt, and pepper. Spread on toasted bread with lettuce."
  },
  {
    id: "q4",
    name: "Black Bean & Cheese Quesadilla",
    category: "quick",
    prepTime: "10 mins",
    ingredients: ["Flour Tortillas", "Shredded Cheddar Cheese", "Canned Black Beans (drained)", "Salsa"],
    instructions: "Place cheese and beans on one half of tortilla. Fold in half and toast in a dry skillet on medium heat for 3-4 mins per side until crispy and melted."
  },
  {
    id: "q5",
    name: "Hummus Veggie Wrap",
    category: "quick",
    prepTime: "8 mins",
    ingredients: ["Large Tortilla/Wrap", "Hummus", "Spinach", "Bell Pepper sliced", "Cucumber sliced"],
    instructions: "Spread a thick layer of hummus over the tortilla. Add spinach, sliced bell peppers, and cucumber. Roll up tightly and slice in half."
  },
  {
    id: "q6",
    name: "Power Peanut Butter Oatmeal",
    category: "quick",
    prepTime: "5 mins",
    ingredients: ["Rolled Oats", "Milk or Water", "Banana sliced", "Peanut Butter", "Cinnamon"],
    instructions: "Microwave oats and liquid for 2 mins. Stir in a large spoonful of peanut butter, top with banana slices, and dust with cinnamon."
  },

  // Budget-friendly Category
  {
    id: "b1",
    name: "Classic Rice and Beans",
    category: "budget-friendly",
    prepTime: "20 mins",
    ingredients: ["White Rice", "Canned Black or Red Beans", "Onion chopped", "Garlic minced", "Cumin", "Coriander"],
    instructions: "Cook rice. Sauté onion and garlic, add beans (with their liquid), cumin, and coriander. Simmer for 10 mins. Serve beans over the warm rice."
  },
  {
    id: "b2",
    name: "Crispy Sheet Pan Tofu & Sweet Potato",
    category: "budget-friendly",
    prepTime: "30 mins",
    ingredients: ["Firm Tofu", "Sweet Potato", "Cornstarch", "Olive Oil", "Salt & Garlic Powder"],
    instructions: "Press and cube tofu, toss in cornstarch and spices. Cube sweet potatoes. Toss both on a sheet pan with oil and roast at 400°F (200°C) for 25 mins."
  },
  {
    id: "b3",
    name: "Pasta Aglio e Olio",
    category: "budget-friendly",
    prepTime: "15 mins",
    ingredients: ["Spaghetti", "Olive Oil", "Garlic thinly sliced", "Red Pepper Flakes", "Parsley"],
    instructions: "Boil spaghetti. In a pan, slowly warm garlic in a generous amount of olive oil. Add red pepper flakes. Toss spaghetti and fresh parsley into the oil."
  },
  {
    id: "b4",
    name: "Savory Potato & Onion Frittata",
    category: "budget-friendly",
    prepTime: "20 mins",
    ingredients: ["Eggs", "Potatoes thinly sliced", "Onion sliced", "Olive Oil", "Salt & Pepper"],
    instructions: "Sauté potatoes and onions in oil until tender. Beat eggs with salt and pepper, pour over potatoes. Cook on medium-low until set, flip or broil to finish."
  },
  {
    id: "b5",
    name: "Simple Egg Drop Soup",
    category: "budget-friendly",
    prepTime: "10 mins",
    ingredients: ["Chicken or Veggie Broth", "Eggs beaten", "Soy Sauce", "Ginger Powder", "Green Onion"],
    instructions: "Bring broth to a boil with ginger and soy sauce. Slowly drizzle in beaten eggs while stirring gently in a circle. Garnish with green onions."
  },
  {
    id: "b6",
    name: "Creamy Chickpea Coconut Curry",
    category: "budget-friendly",
    prepTime: "25 mins",
    ingredients: ["Canned Chickpeas", "Canned Coconut Milk", "Curry Powder", "Onion", "Spinach"],
    instructions: "Sauté onion, add curry powder. Pour in coconut milk and drained chickpeas. Simmer for 15 mins. Stir in spinach until wilted. Serve with rice or flatbread."
  }
];

// @route   GET api/meals/suggest
// @desc    Get a random meal suggestion (optional category filter)
// @access  Public (or Private)
router.get('/suggest', (req, res) => {
  const { category } = req.query;
  
  let meals = mealDatabase;
  
  if (category) {
    const formattedCategory = category.toLowerCase().trim();
    // Support category match (like healthy, quick, budget-friendly / budget)
    meals = mealDatabase.filter(meal => 
      meal.category === formattedCategory || 
      (formattedCategory === 'budget' && meal.category === 'budget-friendly')
    );
  }

  if (meals.length === 0) {
    return res.status(404).json({ message: 'No meals found in this category' });
  }

  const randomIndex = Math.floor(Math.random() * meals.length);
  res.json(meals[randomIndex]);
});

module.exports = router;
