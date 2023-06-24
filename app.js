//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://eruditeme:{password}@cluster0.xxxxxxx.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const listSchema = {
  name:String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

const newList = [];

const day = date.getDate();

app.get("/", function(req, res) {

  Item.find().then((data) => {
    res.render("list", {
      listTitle: day, 
      newListItems: data
    });
  })

});

//Creates or finds custom to do list
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
  .then((foundList) => {
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: newList
      })
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: customListName, 
        newListItems: foundList.items
      });
    }
  })
})

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({name:itemName});
  if (listName === day) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName})
    .then((foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === day) {
    Item.findOneAndRemove({_id: checkedItemId})
    .then(() => {
      res.redirect('/');
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
    .then((foundList) => {
      res.redirect("/" + listName);
    })
  }
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => {
  console.log('Server has started');
})
