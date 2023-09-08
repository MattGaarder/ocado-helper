const express = require('express');
const app = express();

const ingredients = require('./routes/ingredients');

const connectDB = require('./database/connect');
require('dotenv').config();
const port = process.env.PORT || 3001;

app.use(express.static('./public'));
app.use(express.json());


app.use('/api/v1/ingredients', ingredients);


const start = async() => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(port, () => {
            console.log(`listening for ${port}`);
        });
    } catch (error) {
        console.log(error);
    }
};

start();