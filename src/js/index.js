import Search from "./models/Search";
import Recipe from "./models/recipe";
import { elements, renderLoader, clearLoader } from "./views/base";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import List from "./models/list";
import Likes from "./models/likes";
/*Global state  of the app
1.Search object 
2.Current recipe object
3.Shopping list object
4.Liked recipes*/
const state = {};

//Search Model
const controlSearch = async () => {
  //1) Get query fromview
  const query = searchView.getInput();
  if (query) {
    //2) New search object and add it to state
    state.search = new Search(query);
    //3) Prepare UI for new result
    searchView.clearinput();
    searchView.clearResults();
    renderLoader(elements.searchRes);
    try {
      //4) Search for recipes
      await state.search.getResults();
      //5) Render result on UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (error) {
      alert("Something went wrong with the search...");
      clearLoader();
    }
  }
};
elements.searchForm.addEventListener("submit", e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener("click", e => {
  const btn = e.target.closest(".btn-inline");
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

//Recipe Model
const controlRecipe = async () => {
  //Get ID from url
  const id = window.location.hash.replace("#", "");

  if (id) {
    //Prepare UI for the changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    //HightLight selected recipe
    if (state.search) searchView.highlightedSelected(id);

    //Create new recipe object
    state.recipe = new Recipe(id);
    try {
      //Get recipe data and parse Ingredients
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();
      //Calculate servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();
      //Render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      console.log(state.recipe);
      alert("Error proccessing recipe!");
      clearLoader();
    }
  }
};
["hashchange", "load"].forEach(event =>
  window.addEventListener(event, controlRecipe)
);

//shopping controller
const controlList = () => {
  //create a new list if there is none yet
  if (!state.list) state.list = new List();

  //Add each ingredient to the list and UI
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

//handle list delete and update item event
elements.shopping.addEventListener("click", e => {
  const id = e.target.closest(".shopping__item").dataset.itemid;
  //Handle the Delete Button
  if (e.target.matches(".shopping__delete, .shopping__delete *")) {
    //Delete from state
    state.list.deleteItem(id);
    //Delete from UI
    listView.deleteItem(id);
    //Handle the count update
  } else if (e.target.matches(".shopping__item-value")) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

//Likes Controller
const controlLikes = () => {
  if (!state.likes) state.likes = new Likes();
  const CurrentID = state.recipe.id;

  //User has NOT Liked yet liked current recipe
  if (!state.likes.isLiked(CurrentID)) {
    //Add like to the state
    const newLike = state.likes.addLikes(
      CurrentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );

    //Toggle the like button
    likesView.toggleLikeBtn(true);

    //Add like to UI list
    likesView.renderLike(newLike);
  }
  //User HAS liked current recipe
  else {
    //remove like to the state
    state.likes.deleteLike(CurrentID);

    //Toggle the like button
    likesView.toggleLikeBtn(false);

    //remove like to UI list
    likesView.deleteLike(CurrentID);
  }
  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//Restore Liked recipe on page load
window.addEventListener("load", () => {
  state.likes = new Likes();
  //Restore Likes
  state.likes.readStorage();
  //toggle like menu button
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  //render the Liked recipe on UI
  state.likes.likes.forEach(like => likesView.renderLike(like));
});

//Handling recipe button clicks

elements.recipe.addEventListener("click", e => {
  if (e.target.matches(".btn-decrease, .btn-decrease *")) {
    //decrease button is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsingredients(state.recipe);
    }
  } else if (e.target.matches(".btn-increase, .btn-increase *")) {
    //increase button is clicked
    state.recipe.updateServings("inc");
    recipeView.updateServingsingredients(state.recipe);
  } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
    //Add the ingredients to the shopping list
    controlList();
  } else if (e.target.matches(".recipe__love, .recipe__love *")) {
    //Like controller
    controlLikes();
  }
});
