require('dotenv').config();
const port = process.env.PORT || 3001;


const express = require('express');
const path = require('path');
const upload = require('./middleware/upload');
const cors = require('cors');

const app = express();
app.use(cors());

const ingredients = require('./routes/ingredients');
const notionRoutes = require('./routes/notionRoutes');


const connectDB = require('./database/mongoConnect');


app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

// console.log("API Token: ", process.env.NOTION_API_KEY);

app.use('/api/v1/ingredients', ingredients);
app.use('/api/v1/notion', notionRoutes);




app.post('/uploads', upload.single('pdf'), (req, res, next) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('Please upload a file');
    }
    res.status(200).send({ filePath: `/uploads/${file.filename}` });
})

app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ msg: 'Something went wrong' });
});

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
// const notion = require('./database/notionConnect');

// console.log(require('dotenv').config());
