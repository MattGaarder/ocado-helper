const express = require('express');
const { getDataBase, getIds, updateData, syncFromNotion } = require('../controllers/notionService');

const router = express.Router();

router.get('/database', getDataBase);

router.post('/getIds', async (req, res, next) => {
    try {
        const { databaseId, authToken } = req.body || {};
        const data = await getIds(
            databaseId || process.env.NOTION_DATABASE_ID,
            authToken || process.env.NOTION_API_KEY
        );
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
});

// Mirrors the Notion database into MongoDB (edits, new rows, and deletions).
// The original version compared against a single (max 100 row) Notion query and
// deleted every Mongo row it could not find, including rows that were never sent
// to Notion. This version paginates and only deletes rows that were linked to
// Notion. Send { "dryRun": true } to preview the changes without writing.
router.post('/sync', async (req, res, next) => {
    try {
        const dryRun = req.body?.dryRun === true;
        const result = await syncFromNotion({ dryRun });
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

router.get('/', (req, res) => {
    res.status(405).json({ msg: 'Create Notion pages through POST /api/v1/ingredients' });
});

router.patch('/:id', updateData);

module.exports = router;
