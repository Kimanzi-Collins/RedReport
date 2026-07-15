// server/index.js
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
const { handleStream } = require('./controllers/streamController');
const { createSession } = require('./controllers/sessionController');
const { getHistory, postHistory, deleteHistory, getReports } = require('./controllers/historyController');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// serverless-http's mocked request (used when this app runs inside a Netlify
// Function) marks its stream `readable: false`, which makes express.json()
// silently skip parsing and leave req.body as the raw Buffer it pre-attaches.
// Locally (plain `node index.js`) express.json() parses normally and this is
// a no-op. In production, catch the unparsed Buffer and decode it ourselves.
app.use((req, res, next) => {
    let raw = null;
    if (Buffer.isBuffer(req.body)) {
        raw = req.body.toString('utf8').trim();
    } else if (typeof req.body === 'string') {
        raw = req.body.trim();
    }
    
    if (raw !== null) {
        if (!raw) {
            req.body = {};
        } else if ((req.headers['content-type'] || '').includes('application/json')) {
            try {
                req.body = JSON.parse(raw);
            } catch (error) {
                return res.status(400).json({ error: 'Invalid JSON body' });
            }
        }
    }
    next();
});

// Initialize Multer for in-memory file parsing
const upload = multer({ storage: multer.memoryStorage() });

// Clean Route Registration passing directly to the controllers
app.post('/api/report', upload.array('files'), generateReport);
app.post('/api/timeline', upload.array('files'), analyzeTimeline);
app.post('/api/mitre', upload.array('files'), mapMitreAttack);
app.post('/api/blueprint', upload.array('files'), generateBlueprint);
app.post('/api/stream', handleStream);

app.post('/api/session', createSession);
app.get('/api/history/:section', getHistory);
app.post('/api/history', postHistory);
app.delete('/api/history/:section', deleteHistory);
app.get('/api/reports', getReports);

if (require.main === module) {
    // Boot sequence
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`RedReport Core active on port ${PORT}`);
    });
}

module.exports = app;
