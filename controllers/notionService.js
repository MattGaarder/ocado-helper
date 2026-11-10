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

// Notion returns at most 100 rows per query, so follow next_cursor until every
// page has been collected. Comparing against a partial list would make rows
// beyond the first page look deleted.
const getAllNotionPages = async () => {
    assertNotionConfiguration();

    const pages = [];
    let cursor;
    do {
        const response = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID,
            start_cursor: cursor,
            page_size: 100
        });
        pages.push(...response.results);
        cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    return pages;
};

// Rows typed directly into Notion have an empty MONGO_ID, so read it defensively.
const getMongoIdFromPage = (page) => {
    const richText = page.properties?.MONGO_ID?.rich_text || [];
    return richText.map((part) => part.plain_text).join('').trim() || null;
};

const getNameFromPage = (page) => {
    const title = page.properties?.Item?.title || [];
    return title.map((part) => part.plain_text).join('').trim();
};

const getLocationFromPage = (page) =>
    normalizeStorageLocation(page.properties?.Storage?.multi_select?.[0]?.name);

const writeMongoIdToPage = (pageId, mongoId) =>
    notion.pages.update({
        page_id: pageId,
        properties: {
            MONGO_ID: {
                rich_text: [{ type: 'text', text: { content: mongoId } }]
            }
        }
    });

// Makes MongoDB match the Notion database. Notion is the source of truth:
//   - Notion row linked to a Mongo document -> Mongo name/location updated to match
//   - Notion row with no (or an unknown) MONGO_ID -> new Mongo document, ID written back
//   - Mongo document linked to a Notion row that no longer exists -> deleted
// Mongo documents that were never linked to Notion (no notionID) are left alone,
// because there is no way to tell whether they were ever meant to be in Notion.
// Pass { dryRun: true } to get the planned changes without writing anything.
const syncFromNotion = async ({ dryRun = false } = {}) => {
    const pages = await getAllNotionPages();
    const ingredients = await Ingredient.find({});

    const byMongoId = new Map(ingredients.map((doc) => [doc._id.toString(), doc]));
    const byNotionId = new Map(
        ingredients.filter((doc) => doc.notionID).map((doc) => [doc.notionID, doc])
    );

    const matchedIds = new Set();
    const created = [];
    const updated = [];
    let skippedUntitled = 0;

    for (const page of pages) {
        const name = getNameFromPage(page);
        const location = getLocationFromPage(page);
        if (!name) {
            skippedUntitled += 1;
            continue;
        }

        const mongoId = getMongoIdFromPage(page);
        let doc = byMongoId.get(mongoId) || byNotionId.get(page.id);

        // A Notion row duplicated in Notion keeps the original's MONGO_ID. Give
        // the copy its own Mongo document instead of letting both rows fight
        // over one.
        if (doc && matchedIds.has(doc._id.toString())) doc = null;

        if (!doc) {
            created.push({ name, location });
            if (!dryRun) {
                const newDoc = await Ingredient.create({ name, location, notionID: page.id });
                await writeMongoIdToPage(page.id, newDoc._id.toString());
            }
            continue;
        }

        const docId = doc._id.toString();
        matchedIds.add(docId);

        const changes = {};
        if (doc.name !== name) changes.name = name;
        if (doc.location !== location) changes.location = location;
        if (doc.notionID !== page.id) changes.notionID = page.id;

        if (Object.keys(changes).length > 0) {
            updated.push({ _id: docId, from: { name: doc.name, location: doc.location }, to: { name, location } });
            if (!dryRun) await Ingredient.updateOne({ _id: doc._id }, changes);
        }

        if (!dryRun && mongoId !== docId) await writeMongoIdToPage(page.id, docId);
    }

    const deleted = ingredients
        .filter((doc) => doc.notionID && !matchedIds.has(doc._id.toString()))
        .map(({ _id, name, location }) => ({ _id: _id.toString(), name, location }));

    if (!dryRun && deleted.length > 0) {
        await Ingredient.deleteMany({ _id: { $in: deleted.map((doc) => doc._id) } });
    }

    return {
        dryRun,
        notionRows: pages.length,
        created,
        updated,
        deleted,
        skippedUntitled,
        unlinkedIgnored: ingredients.filter((doc) => !doc.notionID).length
    };
};

const updateData = asyncWrapper(async (req, res) => {
    res.status(501).json({ msg: 'Notion updates are not implemented' });
});

module.exports = {
    createNotionPages,
    updateData,
    getDataBase,
    getIds,
    getAllNotionPages,
    syncFromNotion
};
