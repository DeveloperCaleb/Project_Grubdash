const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//Middleware
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;

    if (data[propertyName]) {
      return next();
    } else
      next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

function propertyIsValid(propertyName) {
  return function (req, res, next) {
    const data = {};

    if (data[propertyName] !== "") {
      return next();
    } else {
      next({ status: 400, message: `Dish must include a ${propertyName}` });
    }
  };
}

function priceIsValid(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (price && typeof price == "number" && price > 0) {
    return next();
  } else {
    next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  }
}

function dishExist(req, res, next) {
  const { dishId } = req.params;

  const foundDish = dishes.find((dish) => dish.id == dishId);

  if (foundDish) {
    res.locals.dish = foundDish;

    return next();
  } else {
    next({ status: 404, message: `No dish with id ${dishId} found` });
  }
}

//Route handlers
function list(req, res) {
  res.json({ data: dishes });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };

  dishes.push(newDish);

  res.status(201).json({ data: newDish });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const { dishId } = req.params;

  const dish = res.locals.dish;
  const { data: { id, name, description, price, image_url } = {} } = req.body;

  if (dishId === id) {
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({ data: dish });
  } else if (!id) {
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({ data: dish });
  } else {
    next({ status: 400, message: `id ${id} does not match ${dishId}` });
  }
}

module.exports = {
  list,
  create: [
    bodyDataHas("name"),
    propertyIsValid("name"),
    bodyDataHas("description"),
    propertyIsValid("description"),
    priceIsValid,
    bodyDataHas("image_url"),
    propertyIsValid("image_url"),
    create,
  ],
  read: [dishExist, read],
  update: [
    dishExist,
    bodyDataHas("name"),
    propertyIsValid("name"),
    bodyDataHas("description"),
    propertyIsValid("description"),
    priceIsValid,
    bodyDataHas("image_url"),
    propertyIsValid("image_url"),
    update,
  ],
};
