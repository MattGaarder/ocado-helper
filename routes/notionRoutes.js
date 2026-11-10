const express = require('express');
const { getDataBase, getIds, updateData } = require('../controllers/notionService');

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

// The original sync operation deleted MongoDB rows that did not appear in a
// partial Notion query. Keep the endpoint explicit and safe until it is rebuilt.
router.post('/sync', (req, res) => {
    res.status(410).json({ msg: 'Sync is disabled while the data flow is rebuilt' });
});

router.get('/', (req, res) => {
    res.status(405).json({ msg: 'Create Notion pages through POST /api/v1/ingredients' });
});

router.patch('/:id', updateData);

module.exports = router;
