require('dotenv').config();
const port = process.env.PORT || 3001;

const express = require('express');

const upload = require('./middleware/upload');
const cors = require('cors');

const app = express();
app.use(cors());

const ingredients = require('./routes/ingredients');
const notionRoutes = require('./routes/notionRoutes');

const connectDB = require('./database/mongoConnect');
// const notion = require('./database/notionConnect');

// console.log(require('dotenv').config());


app.use(express.static('./public')); 
app.use('/uploads', express.static('uploads'));
app.use(express.json());

// console.log("API Token: ", process.env.NOTION_API_KEY);

app.use('/api/v1/ingredients', ingredients);
app.use('/api/v1/notion', notionRoutes);



app.post('/uploads', upload.single('pdf'), (req, res, next) => {
    const file = req.file;
    if(!file) {
        return res.status(400).send('Please upload a file');
    }
    res.status(200).send('File uploaded successfully ', { filePath: filePath });
})

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