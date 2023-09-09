const asyncWrapper = require('../middleware/async');

const myMongooseModel = require('../models/Ingredient'); 


const { Client } = require('@notionhq/client');

const notion = new Client({
    auth: process.env.NOTION_API_KEY
});
console.log("API Token: ", process.env.NOTION_API_KEY);
const getData = asyncWrapper(async(req, res) => {
    const mongoData = await myMongooseModel.find({});
    if (!mongoData) {
        return res.status(404).json({ error: 'Data not found in MongoDB' });
    }
    console.log("this is mongoData logged in notionService on line 15: ", mongoData);
    const notionData = await notion.databases.create({
    parent: {
            database_id: "your-notion-database-id",  // Replace with your Notion database ID
        },
        properties: {
            // ... fill in with the actual properties you want to set
        }
    });

    res.status(200).json({ mongoData, notionData });

});

const updateData = asyncWrapper(async(req, res) => {
    const updateData = await notion.databases.create({});
    res.status(200).json({ updateData });

});

module.exports = { getData, updateData }


// // yourController.js
// const mongoService = require('./mongoService');
// const notionService = require('./notionService');

// const addData = async (req, res) => {
//   try {
//     // Add data to MongoDB
//     const mongoData = await mongoService.addData(req.body.someData);

//     // Synchronize with Notion
//     await notionService.updateSomeData(mongoData);

//     res.status(200).json({ message: 'Data added to MongoDB and Notion' });
//   } catch (error) {
//     console.error('There was an error:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// };

// module.exports = {
//   addData
// };

// Flow Summary
// The client clicks a submit button, triggering an Axios POST request to your server's /api/mongo/add endpoint.

// Your server receives the request in the addData function, adds the data to MongoDB, and then updates Notion.

// A success response is sent back to the client.