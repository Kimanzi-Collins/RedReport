// server/index.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

// Import controllers
const { generateReport } = require('./controllers/reportController');
const { analyzeTimeline } = require('./controllers/timelineController');
const { mapMitreAttack } = require('./controllers/mitreController');
const { generateBlueprint } = require('./controllers/blueprintController');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Memory storage for fast stream processing of uploaded logs
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// API Endpoints
app.post('/api/generate-report', upload.array('logFiles', 5), generateReport);
app.post('/api/analyze-timeline', upload.array('logFiles', 5), analyzeTimeline);
app.post('/api/map-mitre', upload.array('logFiles', 5), mapMitreAttack);
app.post('/api/generate-blueprint', upload.array('logFiles', 5), generateBlueprint);

app.listen(port, () => {
    console.log(`Jarvis System Online: Multi-Engine Backend running on port ${port}`);
});