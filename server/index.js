// server/index.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

// Exact function imports from our controllers
const { generateReport } = require('./controllers/reportController');
const { analyzeTimeline } = require('./controllers/timelineController');
const { mapMitreAttack } = require('./controllers/mitreController');
const { generateBlueprint } = require('./controllers/blueprintController');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Multer for in-memory file parsing
const upload = multer({ storage: multer.memoryStorage() });

// Clean Route Registration passing directly to the controllers
app.post('/api/report', upload.array('files'), generateReport);
app.post('/api/timeline', upload.array('files'), analyzeTimeline);
app.post('/api/mitre', upload.array('files'), mapMitreAttack);
app.post('/api/blueprint', upload.array('files'), generateBlueprint);

if (require.main === module) {
    // Boot sequence
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`RedReport Core active on port ${PORT}`);
    });
}

module.exports = app;
