const express = require('express');
const router = express.Router();

const { getData, updateData } = require('../controllers/notionService');

router.route('/').get(getData);
router.route('/:id').patch(updateData);

module.exports = router;



// router.get('/get-notion-data', async (req, res) => {
//   const data = await getSomeData();
//   res.json(data);
// });

// router.post('/update-notion-data', async (req, res) => {
//   await updateSomeData(req.body);
//   res.json({ message: 'Data updated' });
// });

// no 2 

// The task of getting data from a MongoDB database and sending it to a Notion database involves several steps.
// First, you'd need to query the MongoDB database to retrieve the data you want. Once you have that data, you can then send it to Notion using the Notion API. Since you're using Mongoose for MongoDB, you'd typically use one of its methods to query your database.
// Here's how you might modify your getData function to first get data from MongoDB:

// const MyMongoModel = require('../models/MyMongoModel'); // Replace with your actual MongoDB model

// const getData = asyncWrapper(async(req, res) => {
//     // Step 1: Get data from MongoDB
//     const mongoData = await MyMongoModel.find();  // Adjust this query based on what you actually need
    
//     if (!mongoData) {
//         return res.status(404).json({ error: 'Data not found in MongoDB' });
//     }
    
//     // Step 2: Send data to Notion (or whatever you need to do with it)
//     // This is a placeholder. You would replace this with code that
//     // correctly updates your Notion database based on the structure of `mongoData`
//     const notionData = await notion.databases.create({
//         parent: {
//             database_id: "your-notion-database-id",  // Replace with your Notion database ID
//         },
//         properties: {
//             // ... fill in with the actual properties you want to set
//         }
//     });
    
//     // Step 3: Send response
//     res.status(200).json({ mongoData, notionData });
// });
