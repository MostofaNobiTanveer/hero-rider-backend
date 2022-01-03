const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const stripe = require('stripe')(process.env.STRIPE_SECRET);

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
    const servicesCollection = database.collection('services');
    const ordersCollection = database.collection('orders');

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
    // get all services
    app.get('/services', async (req, res) => {
      const cursor = servicesCollection.find({});
      const services = await cursor.toArray();
      res.json(services);
    });
    // get service by id
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await servicesCollection.findOne(query);
      res.json(service);
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
      const page = req.query.page;
      const size = parseInt(req.query.size);
      const count = await cursor.count();
      let users;
      if (page) {
        users = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        users = await cursor.toArray();
      }
      res.json({ count, users });
    });

    // block a user
    app.put('/users', async (req, res) => {
      const result = await usersCollection.updateOne(
        { _id: ObjectId(req.body._id) },
        {
          $set: {
            blocked: req.body.blocked,
          },
        }
      );
      res.json(result);
    });

    // make an user admin
    app.put('/users/admin', async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: 'admin' } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // check user role
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

    // **************************
    // *Payment intent*

    app.post('/create-payment-intent', async (req, res) => {
      const paymentInfo = req.body;
      const amount = paymentInfo.price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: 'usd',
        amount,
        payment_method_types: ['card'],
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    });

    // **************************
    // *Paid services*
    app.post('/services-ordered', async (req, res) => {
      const orderedService = req.body;
      const result = await ordersCollection.insertOne(orderedService);
      res.json(result);
    });
    app.get('/services-ordered', async (req, res) => {
      const cursor = ordersCollection.find({});
      const orders = await cursor.toArray();
      res.json(orders);
    });
    app.get('/services-ordered/:email', async (req, res) => {
      const result = await ordersCollection
        .find({
          email: req.params.email,
        })
        .toArray();
      res.json(result);
    });
    
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
