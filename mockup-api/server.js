const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.json());

let steps = [
  { id: "confirm-shoulder", description: "Is the animal divided?", type: "confirm" },
  { id: "remove-injury", description: "Remove shoulder injury from carcass", type: "confirm" },
  { id: "input-weight", description: "Enter weight of removed part (kg)", type: "input" },
  { id: "upload-photo", description: "Upload picture of removed part", type: "photo" },
  { id: "print-labels", description: "Print new label", type: "labels" },
];

let currentIndex = 0;

// Middleware for logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/next-action', (req, res) => {
  if (currentIndex >= steps.length) {
    return res.json([{ finished: true }]);
  }

  const action = { ...steps[currentIndex] };
  currentIndex++;

  if (currentIndex >= steps.length) {
    action.finished = true;
  }

  res.json(action);
});

app.post('/submit', (req, res) => {
  console.log("Received data on /submit:", req.body);
  res.sendStatus(200);
});

app.post('/upload-photo', upload.single('photo'), (req, res) => {
  console.log("Photo uploaded on /upload-photo for:", req.body);
  res.sendStatus(200);
});

app.get('/station', (req, res) => {
  res.json({
    name: "ESA_SH05 - Slaughter Recovery",
    printer: "LBL 101"
  });
});

app.get('/animal-info', (req, res) => {
  const number = req.query.number;
  res.json({ id: number, type: "Vitender", date: "2025-01-13" });
});

app.get('/session', (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post('/reset', (req, res) => {
  currentIndex = 0;
  console.log("Session reset: currentIndex set to 0");
  res.json({ message: "Session has been reset." });
});

app.listen(3001, () => {
  console.log('Stub MES API running at http://localhost:3001');
});
