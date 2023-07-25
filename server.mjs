import express from "express";
import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('1234567890', 20)
import { MongoClient } from "mongodb"

import './config/index.mjs'

// const mongodbURI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.bykenlf.mongodb.net/?retryWrites=true&w=majority`
const mongodbURI = "mongodb+srv://talha1:talha1@cluster0.nxgymft.mongodb.net/?retryWrites=true&w=majority"

let productsCollection
try {
  const client = new MongoClient(mongodbURI);
  const database = client.db('ecom');
  console.log("db", database);
  productsCollection = database.collection('products');
} catch (err) {
  console.log("errr", err);
}


const app = express();
app.use(express.json());

// ... (existing imports and code) ...

app.get("/products", async (req, res, next) => {
  try {
    const products = await productsCollection.find().toArray();
    res.send({
      message: "all products",
      data: products
    });
  } catch (err) {
    next(err);
  }
});

app.get("/product/:id", async (req, res, next) => {
  try {
    const productId = req.params.id;
    if (isNaN(productId)) {
      res.status(403).send("invalid product id");
    }

    const product = await productsCollection.findOne({ id: productId });

    if (!product) {
      res.status(404);
      res.send({
        message: "product not found"
      });
    } else {
      res.send({
        message: "product found with id: " + product.id,
        data: product
      });
    }
  } catch (err) {
    next(err);
  }
});

app.post("/product", async (req, res, next) => {
  try {
    const { name, price, description } = req.body;

    if (!name || !price || !description) {
      res.status(400).send(`
        Required parameter missing. Example JSON request body:
        {
          "name": "abc product",
          "price": "$23.12",
          "description": "abc product description"
        }`);
      return;
    }

    const doc = {
      id: nanoid(),
      name,
      price,
      description,
    };

    await productsCollection.insertOne(doc);
    res.status(201).send({ message: "created product" });
  } catch (err) {
    next(err);
  }
});

app.put("/product/:id", async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { name, price, description } = req.body;

    if (!name && !price && !description) {
      res.status(400).send(`
        Required parameter missing. 
        At least one parameter is required: name, price, or description to complete the update.
        Example JSON request body:
        {
          "name": "abc product",
          "price": "$23.12",
          "description": "abc product description"
        }`);
      return;
    }

    const product = await productsCollection.findOne({ id: productId });

    if (!product) {
      res.status(404).send({
        message: "product not found"
      });
    } else {
      if (name) product.name = name;
      if (price) product.price = price;
      if (description) product.description = description;

      await productsCollection.updateOne({ id: productId }, { $set: product });

      res.send({
        message: "product is updated with id: " + product.id,
        data: product
      });
    }
  } catch (err) {
    next(err);
  }
});

app.delete("/product/:id", async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await productsCollection.findOne({ id: productId });

    if (!product) {
      res.status(404).send({
        message: "product not found"
      });
    } else {
      await productsCollection.deleteOne({ id: productId });
      res.send({
        message: "product is deleted"
      });
    }
  } catch (err) {
    next(err);
  }
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// ... (remaining code) ...




const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
