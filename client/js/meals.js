// LifeOS Meal Suggestion Tool Handler

const Meals = {
  currentCategory: 'all',
  isRolling: false,

  init() {
    this.rollBtn = document.getElementById('roll-meal-btn');
    this.catBtns = document.querySelectorAll('.meal-cat-btn');
    this.suggestionCard = document.getElementById('meal-suggestion-card');
    
    // Mini widgets on Dashboard
    this.miniMealCard = document.getElementById('mini-meal-suggestion');
    this.quickRollBtns = document.querySelectorAll('.quick-meal-roll');

    this.bindEvents();
  },

  bindEvents() {
    // Category selection in main tab
    this.catBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target.closest('.meal-cat-btn');
        this.catBtns.forEach(b => b.classList.remove('active'));
        target.classList.add('active');
        this.currentCategory = target.dataset.category;
      });
    });

    // Roll trigger in main tab
    if (this.rollBtn) {
      this.rollBtn.addEventListener('click', () => this.rollMeal());
    }

    // Quick Roll buttons on Dashboard
    this.quickRollBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        this.rollMealMini(category);
      });
    });
  },

  async fetchSuggestion(category) {
    let url = '/meals/suggest';
    if (category && category !== 'all') {
      url += `?category=${category}`;
    }
    return API.get(url);
  },

  async rollMeal() {
    if (this.isRolling) return;
    this.isRolling = true;

    // Trigger shuffle sound or card shake animation
    this.suggestionCard.classList.add('shuffling');

    // Create a slot machine effect changing titles rapidly
    const placeholderNames = [
      "Mixing salad...", "Firing up the grill...", "Chopping veggies...",
      "Boiling pasta...", "Simmering soup...", "Baking salmon...",
      "Slicing avocados...", "Sautéing onions..."
    ];
    
    let counter = 0;
    const frontEl = this.suggestionCard.querySelector('.meal-card-front');
    const contentEl = this.suggestionCard.querySelector('.meal-card-content');
    
    // Hide details during roll
    contentEl.classList.add('hidden');
    frontEl.classList.remove('hidden');
    
    const originalTitle = frontEl.querySelector('h3').textContent;
    const originalDesc = frontEl.querySelector('p').textContent;

    const interval = setInterval(() => {
      frontEl.querySelector('h3').textContent = "Rolling...";
      frontEl.querySelector('p').textContent = placeholderNames[counter % placeholderNames.length];
      counter++;
    }, 80);

    try {
      const meal = await this.fetchSuggestion(this.currentCategory);
      
      // Stop animation
      clearInterval(interval);
      
      setTimeout(() => {
        this.suggestionCard.classList.remove('shuffling');
        
        // Hide Front and Show Details
        frontEl.classList.add('hidden');
        contentEl.classList.remove('hidden');

        // Populate details
        document.getElementById('meal-badge').textContent = meal.category;
        // Apply appropriate badge color
        const badgeColors = {
          healthy: 'var(--success-color)',
          quick: 'var(--info-color)',
          'budget-friendly': 'var(--warning-color)'
        };
        document.getElementById('meal-badge').style.color = badgeColors[meal.category] || 'var(--primary-color)';
        document.getElementById('meal-badge').style.background = `rgba(from ${badgeColors[meal.category] || 'var(--primary-color)'} r g b / 0.15)`;

        document.getElementById('meal-name').textContent = meal.name;
        document.getElementById('meal-time-val').textContent = meal.prepTime;
        
        // List ingredients
        const ingList = document.getElementById('meal-ingredients');
        ingList.innerHTML = meal.ingredients.map(ing => `<li>${ing}</li>`).join('');
        
        // Text instructions
        document.getElementById('meal-instructions').textContent = meal.instructions;

        // Also synchronize mini widget on dashboard
        this.updateMiniWidgetView(meal);

        this.isRolling = false;
      }, 600); // Animation duration match

    } catch (err) {
      clearInterval(interval);
      this.suggestionCard.classList.remove('shuffling');
      frontEl.querySelector('h3').textContent = originalTitle;
      frontEl.querySelector('p').textContent = "Connection issue. Try rolling again.";
      this.isRolling = false;
    }
  },

  async rollMealMini(category) {
    this.miniMealCard.innerHTML = `
      <div style="text-align: center; color: var(--text-secondary);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
        <p style="font-size: 0.8rem;">Deciding meal...</p>
      </div>
    `;

    try {
      const meal = await this.fetchSuggestion(category);
      // Short delay for visual polish
      setTimeout(() => {
        this.updateMiniWidgetView(meal);
        // If main pane is visible, sync it too
        const activeTab = document.querySelector('.nav-link.active').dataset.target;
        if (activeTab === 'meals') {
          this.currentCategory = category === 'budget' ? 'budget-friendly' : category;
          // select button in categories
          this.catBtns.forEach(btn => {
            if (btn.dataset.category === category) btn.click();
          });
        }
      }, 500);
    } catch (err) {
      this.miniMealCard.innerHTML = `<p class="meal-placeholder">Failed to get suggestion. Try again.</p>`;
    }
  },

  updateMiniWidgetView(meal) {
    const categoryLabels = {
      healthy: '🟢 Healthy',
      quick: '⚡ Quick & Easy',
      'budget-friendly': '🪙 Budget'
    };
    
    this.miniMealCard.innerHTML = `
      <span class="mini-meal-cat">${categoryLabels[meal.category]} • ${meal.prepTime}</span>
      <h4 class="mini-meal-name">${meal.name}</h4>
      <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
        ${meal.instructions}
      </p>
    `;
  }
};

window.Meals = Meals;
