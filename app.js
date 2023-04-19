//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const clusterUsername = process.env.CLUSTER_USERNAME;
const clusterPassword = process.env.CLUSTER_PASSWORD;

const url = "mongodb+srv://" + clusterUsername + ":" + clusterPassword + "@cluster0.zqqzh9f.mongodb.net/todolistDB"

mongoose.connect(url);

const itemsSchema = {
  name: String
};

const Item = new mongoose.model("Item", itemsSchema);

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = new mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "<-- hit this to delete an item"
});

const item3 = new Item({
  name: "hit the + button to add new stuff."
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {

  Item.find({})
  .then(function(foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems)
      .then(function() {console.log("successfuly inserted")})
      .catch(function(err) {console.log(err)});
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })
  .catch(function(err) {
    console.log(err);
  });
});

app.get("/:customList", function(req, res) {
  const customList = _.capitalize(req.params.customList);

  List.findOne({name: customList})
  .then((foundList) => {
    if (!foundList) {
      const list = new List({
        name: customList,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customList);
    } else {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  })
  .catch(err => console.log("error: " + err));
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName})
    .then((foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
    .catch(err => console.log(err));
  }
});

app.post("/delete", function(req, res) {
  const itemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(itemID)
    .then(() => res.redirect("/"))
    .catch(err => console.log(err));
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemID}}})
    .then(() => res.redirect("/" + listName))
    .catch((err) => console.log(err));
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port" + port);
});
