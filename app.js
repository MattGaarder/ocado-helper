require('dotenv').config();
const express = require('express');
const app = express();

const ingredients = require('./routes/ingredients');
const notionRoutes = require('./routes/notionRoutes');

const connectDB = require('./database/mongoConnect');
// const notion = require('./database/notionConnect');

console.log(require('dotenv').config());
const port = process.env.PORT || 3001;

app.use(express.static('./public')); 
app.use(express.json());
console.log("API Token: ", process.env.NOTION_API_KEY);

app.use('/api/v1/ingredients', ingredients);
app.use('/api/v1/notion', notionRoutes);

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