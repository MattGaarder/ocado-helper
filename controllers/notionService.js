const { addNotionIDToMongoEntryVariable } = require('./ingredients')

const asyncWrapper = require('../middleware/async');
const axios = require('axios');

const myMongooseModel = require('../models/Ingredient'); 


const { Client } = require('@notionhq/client');

const notion = new Client({
    auth: process.env.NOTION_API_KEY
});

// console.log("API Token: ", process.env.NOTION_API_KEY);

const getDataBase = asyncWrapper(async(req, res) => {
    const notionDatabase = await notion.databases.retrieve({
        "database_id": process.env.NOTION_DATABASE_ID
    })
    // console.log(notionDatabase);
    res.status(200).json(notionDatabase);
});

// const getIds = asyncWrapper(async(req, res, next) => {
//     const databaseId = req.body.databaseId;
//     const authToken = req.body.authToken;
//     const response = await axios.post(`https://api.notion.com/v1/databases/${databaseId}/query`,{}, {
//         headers: {
//             "Authorization": `Bearer ${authToken}`,
//             "Notion-Version": "2022-06-28"
//           }
//     });
//     console.log(response.data);
//     res.status(200).json(response.data);
// });

const getIds = async (databaseId, authToken) => {
    const response = await axios.post(`https://api.notion.com/v1/databases/${databaseId}/query`,{}, {
        headers: {
            "Authorization": `Bearer ${authToken}`,
            "Notion-Version": "2022-06-28"
        }
    });
    return response.data;
};

// I also added an empty object {} as the second argument to axios.post(). This serves as the request payload, which you don't seem to be using in this request.

// const getNotionData = asyncWrapper(async() => {
//     const mongoData = await myMongooseModel.find({});
//     if (!mongoData) {
//         throw new Error('data not found');
//     }
//     return mongoData;
// })

function getStorageOptionId(locationName, options) {
    const option = options.find(opt => opt.name === locationName);
    if (option) return option.id;
    return null;  // or throw an error if you want stricter checking
  }

const createPages = asyncWrapper(async(req, res) => {
    // console.log(notion);
    const mongoData = await myMongooseModel.find({});
    console.log("🚀 ~ file: notionService.js:67 ~ createPages ~ mongoData:", mongoData)
    
    if (!mongoData) {
        return res.status(404).json({ error: 'Data not found in MongoDB' });
    }
    const storageOptions = [
        { id: "zJI|", name: "Missing" },
        { id: "_gzg", name: "Cupboard" },
        { id: ":^>^", name: "Frozen" },
        { id: "rKoC", name: "Fridge" }
    ];
    // console.log("this is mongoData logged in notionService on line 15: ", mongoData);
    const createdRows = [];
    for(let data of mongoData){
        const storageOptionId = getStorageOptionId(data.location, storageOptions);
        console.log("🚀 ~ file: notionService.js:80 ~ createPages ~ data.location:", data.location)
        console.log("🚀 ~ file: notionService.js:80 ~ createPages ~ storageOptionId:", storageOptionId)
        
        // console.log("logging data.name when iterating through data of mondoData in notionService", data);
        const notionData = await notion.pages.create({
            "parent": {
                "type": "database_id",  // Replace with your Notion database ID
                "database_id": process.env.NOTION_DATABASE_ID
            },
            "properties": {
                "Item": {
                    "title": [
                        {
                            "type": "text",
                            "text": {
                                "content": data.name,
                            }
                        }
                    ]
                },
                "Storage": {
                    "multi_select": [
                        {
                            "id": storageOptionId
                        }
                    ]
                },
                "MONGO_ID": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": data._id.toString(),
                            }
                        }
                    ]
                },                 
            }
        });
        createdRows.push(notionData)
        
    }
    console.log("skipittytoilet:: ", createdRows[0].properties.MONGO_ID.rich_text[0].plain_text);
    console.log("itsabwoodapp:: ", createdRows[0].id);
    addNotionIDToMongoEntryVariable(createdRows);
    res.status(200).json({ mongoData, createdRows });
});

const updateData = asyncWrapper(async(req, res) => {
    const updateData = await notion.databases.create({});
    res.status(200).json({ updateData });

});

module.exports = { createPages, updateData, getDataBase, getIds }


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