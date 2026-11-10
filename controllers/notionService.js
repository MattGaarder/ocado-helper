const axios = require('axios');
const { Client } = require('@notionhq/client');
const asyncWrapper = require('../middleware/async');
const Ingredient = require('../models/Ingredient');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const normalizeStorageLocation = (location) => {
    if (location === 'Freezer') return 'Frozen';
    return location || 'Missing';
};

const assertNotionConfiguration = () => {
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
        throw new Error('NOTION_API_KEY and NOTION_DATABASE_ID must be configured');
    }
};

const getDataBase = asyncWrapper(async (req, res) => {
    assertNotionConfiguration();
    const notionDatabase = await notion.databases.retrieve({
        database_id: process.env.NOTION_DATABASE_ID
    });
    res.status(200).json(notionDatabase);
});

const getIds = async (databaseId, authToken) => {
    if (!databaseId || !authToken) {
        throw new Error('A Notion database ID and token are required');
    }

    const response = await axios.post(
        `https://api.notion.com/v1/databases/${databaseId}/query`,
        {},
        {
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Notion-Version': '2022-06-28'
            }
        }
    );

    return response.data;
};

const createNotionPages = async (ingredients) => {
    assertNotionConfiguration();

    if (!Array.isArray(ingredients)) {
        throw new TypeError('Ingredients must be an array');
    }

    const createdRows = [];
    for (const ingredient of ingredients) {
        const notionData = await notion.pages.create({
            parent: {
                type: 'database_id',
                database_id: process.env.NOTION_DATABASE_ID
            },
            properties: {
                Item: {
                    title: [
                        {
                            type: 'text',
                            text: { content: ingredient.name }
                        }
                    ]
                },
                Storage: {
                    multi_select: [{ name: normalizeStorageLocation(ingredient.location) }]
                },
                MONGO_ID: {
                    rich_text: [
                        {
                            type: 'text',
                            text: { content: ingredient._id.toString() }
                        }
                    ]
                }
            }
        });

        await Ingredient.findByIdAndUpdate(ingredient._id, { notionID: notionData.id });
        createdRows.push(notionData);
    }

    return createdRows;
};

const updateData = asyncWrapper(async (req, res) => {
    res.status(501).json({ msg: 'Notion updates are not implemented' });
});

module.exports = { createNotionPages, updateData, getDataBase, getIds };
