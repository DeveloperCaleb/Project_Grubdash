const { stat } = require("fs");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//middleware
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;

    if (data[propertyName]) {
      return next();
    } else {
      return next({
        status: 400,
        message: `Order must include a ${propertyName}`,
      });
    }
  };
}

function dishesIsValid(propertyName) {
  return function (req, res, next) {
    const { data: { dishes } = {} } = req.body;

    if (Array.isArray(dishes) && dishes.length > 0) {
      next();
    } else {
      next({ status: 400, message: "Order must include at least 1 dish" });
    }
  };
}

function dishesQuantityIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  let badDishIndex = 0;

  const dishHasQuantity = dishes.every((dish, index) => {
    if (
      dish.quantity &&
      typeof dish.quantity == "number" &&
      dish.quantity > 0
    ) {
      return true;
    } else {
      badDishIndex = index;
    }
  });

  if (dishHasQuantity == true) {
    next();
  } else {
    next({
      status: 400,
      message: `Dish ${badDishIndex} must have a quantity that is an integer greater than 0`,
    });
  }
}

function orderExist(req, res, next) {
  const { orderId } = req.params;

  const foundOrder = orders.find((order) => order.id == orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;

    return next();
  } else {
    next({ status: 404, message: `No order with id ${orderId} found` });
  }
}

function statusIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;

  const statusValues = ["pending", "preparing", "out-for-delivery"];

  if (statusValues.includes(status) && status != "delivered") {
    next();
  } else {
    if (status == "delivered") {
      next({
        status: 400,
        message: "A delivered order cannot be changed",
      });
    } else {
      next({
        status: 400,
        message:
          "Order must have a status of pending, preparing, out-for-delivery, delivered",
      });
    }
  }
}

function statusIsPending(req, res, next) {
  const order = res.locals.order;

  if (order.status === "pending") {
    next();
  } else {
    next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  }
}

//route handlers
function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };

  orders.push(newOrder);

  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res, next) {
  const { orderId } = req.params;

  const order = res.locals.order;

  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;

  if (orderId === id) {
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json({ data: order });
  } else if (!id) {
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json({ data: order });
  } else {
    next({ status: 400, message: `id ${id} does not match ${orderId}` });
  }
}

function destroy(req, res) {
  const { orderId } = req.params;

  const index = orders.findIndex((order) => order.id === orderId);

  const deletedOrders = orders.splice(index, 1);

  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesIsValid("dishes"),
    dishesQuantityIsValid,
    create,
  ],
  read: [orderExist, read],
  update: [
    orderExist,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    bodyDataHas("status"),
    dishesIsValid("dishes"),
    dishesQuantityIsValid,
    statusIsValid,
    update,
  ],
  destroy: [orderExist, statusIsPending, destroy],
};
