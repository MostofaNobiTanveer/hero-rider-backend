const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const port = process.env.PORT || 4000;

// middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jc626.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db('hero-rider');
    const usersCollection = database.collection('users');
    const ridersCollection = database.collection('riders');
    // const ordersCollection = database.collection("orders");
    // const productsCollection = database.collection("products");

    // **************************
    // *USER*

    // add user to database
    app.post('/users', async (req, res) => {
      console.log(req.body);
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
      console.log(result);
    });
    // add rider to database
    app.post('/riders', async (req, res) => {
      const user = req.body;
      const result = await ridersCollection.insertOne(user);
      res.json(result);
    });

    // upsert user
    app.put('/users', async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // get all users
    app.get('/users', async (req, res) => {
      const cursor = usersCollection.find({});
      const users = await cursor.toArray();
      res.json(users);
    });

    // make an user admin
    app.put('/users/admin', async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: 'admin' } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // check if the user is Admin
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      let isRider = false;
      if (user?.role === 'admin') {
        isAdmin = true;
      }
      if (user?.role === 'rider') {
        isRider = true;
      }
      res.json({ admin: isAdmin, rider: isRider });
    });

    // // **************************
    // // *REVIEW*

    // //  update reviews
    // app.post("/reviews", async (req, res) => {
    //   const userReview = req.body;
    //   const result = await reviewsCollection.insertOne(userReview);
    //   res.json(result);
    // });

    // // get all reviews
    // app.get("/reviews", async (req, res) => {
    //   const cursor = reviewsCollection.find({});
    //   const reviews = await cursor.toArray();
    //   res.json(reviews);
    // });

    // // **************************
    // // *PRODUCTS*

    // //  post product
    // app.post("/products", async (req, res) => {
    //   const product = req.body;
    //   const result = await productsCollection.insertOne(product);
    //   res.json(result);
    // });

    // // get all products
    // app.get("/products", async (req, res) => {
    //   const cursor = productsCollection.find({});
    //   const products = await cursor.toArray();
    //   res.json(products);
    // });

    // // get single product
    // app.get("/products/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: ObjectId(id) };
    //   const product = await productsCollection.findOne(query);
    //   res.json(product);
    // });

    // // DELETE a Product
    // app.delete("/deleteProduct/:id", async (req, res) => {
    //   const result = await productsCollection.deleteOne({
    //     _id: ObjectId(req.params.id),
    //   });
    //   res.send(result);
    // });

    // // **************************
    // // *ORDERS*

    // // Add Order API
    // app.post("/placeOrder", async (req, res) => {
    //   const order = req.body;
    //   const result = await ordersCollection.insertOne(order);
    //   res.json(result);
    // });

    // //GET orders
    // app.get("/orders", async (req, res) => {
    //   const cursor = ordersCollection.find({});
    //   const orders = await cursor.toArray();
    //   res.send(orders);
    // });

    // // GET my Orders
    // app.get("/orders/:email", async (req, res) => {
    //   const result = await ordersCollection
    //     .find({
    //       email: req.params.email,
    //     })
    //     .toArray();
    //   res.send(result);
    // });

    // // Update an order status
    // app.put("/updateOrder/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const updatedOrder = req.body;
    //   const filter = { _id: ObjectId(id) };
    //   const options = { upsert: true };
    //   const updateDoc = {
    //     $set: {
    //       status: updatedOrder.status,
    //     },
    //   };
    //   const result = await ordersCollection.updateOne(
    //     filter,
    //     updateDoc,
    //     options
    //   );
    //   res.send(result);
    // });

    // // DELETE an Order
    // app.delete("/deleteOrder/:id", async (req, res) => {
    //   // console.log(req.params.id);
    //   const result = await ordersCollection.deleteOne({
    //     _id: ObjectId(req.params.id),
    //   });
    //   res.send(result);
    // });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hero Rider Server is Running!');
});

app.listen(port, () => {
  console.log(`listening at ${port}`);
});
