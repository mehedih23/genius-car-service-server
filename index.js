const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());


function authVerify(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unothorized' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden' })
        }
        req.decoded = decoded;
        next();
    })
}


app.get('/', (req, res) => {
    res.send(' Hello From Server');
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@genius-car-service.s9jum.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {

    try {
        await client.connect();
        const serviceCollection = client.db('genius-car-service').collection('services');
        const orderCollection = client.db('genius-car-service').collection('orders');

        // Authentication //
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.JWT_ACCESS_TOKEN, {
                expiresIn: '1d'
            });
            console.log(accessToken)
            res.send({ accessToken });
        })



        // Get All Items //
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        })

        // Get a single item //
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

        // Post services //
        app.post('/service', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result)
        })


        // Delete Services //
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.deleteOne(query);
            res.send(result)
        })

        // Oders section //

        // post user orders //
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        // get users orders //
        app.get('/order', authVerify, async (req, res) => {
            console.log(req)
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const services = await cursor.toArray();
                res.send(services)
            } else {
                res.status(403).send({ message: 'Forbidden' })
            }
        })
    }
    finally {

    }
}

run().catch(console.dir);




app.listen(port, () => {
    console.log('Port = ', port);
})