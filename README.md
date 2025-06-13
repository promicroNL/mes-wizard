## 🐷 MES Wizard

**MES Wizard POC** is a simple mock-up app designed to simulate step-by-step actions in a Meat Execution System (MES) environment. It provides a dynamic flow of operations such as confirmations, photo uploads, and label printing, powered by a lightweight Node.js API.

---

### 🚀 Features

* Step-by-step action flow (one action at a time)
* Dynamic action types: confirm, input, photo, label
* Automatically marks the final step with `finished: true`
* Fully resettable session via API
* Simple local image upload and form submission
* Clear API logs for traceability

---

## 🧱 Tech Stack

* **Frontend**: React (or your chosen framework)
* **Backend - just a stub!!!**: Node.js + Express
* **File Uploads**: `multer`
* **Dev Tools**: CORS, JSON body parsing
---

## 🛠️ To do
* **Logging**: Implement Logging from client to API

---

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/promicroNL/mes-wizard.git
cd mes-wizard
```

---

### 2. Start the backend server

```bash
cd mockup-api
npm install
node server.js
```

This runs the mock MES API at:
**`http://localhost:3001`**

You’ll see logs for each API request in the console.

---

### 3. Start the React frontend

```bash
npm install
npm start
```

The app will open in your browser at:
**`http://localhost:3000`**

Make sure the frontend uses `http://localhost:3001` to communicate with the backend.

---

## 📡 API Endpoints

| Method | Endpoint        | Description                      |
| ------ | --------------- | -------------------------------- |
| GET    | `/next-action`  | Returns the next single MES step |
| POST   | `/submit`       | Submits form/input data          |
| POST   | `/upload-photo` | Uploads a photo (form-data)      |
| POST   | `/reset`        | Resets the workflow              |
| GET    | `/station`      | Returns station info             |
| GET    | `/animal-info`  | Gets info for a given animal ID  |
| GET    | `/session`      | Returns session metadata         |

---

## 🧪 Example Output

```json
[
  "id": "input-weight",
  "description": "Enter weight of removed part (kg)",
  "type": "input",
  "finished": false
]
```

Final step will include:

```json
[
  "id": "print-labels",
  "description": "Print new label",
  "type": "labels",
  "finished": true
]
```

Or if all steps are done:

```json
[ "finished": true ]
```

---

## 🔁 Resetting the Workflow

To restart the flow at any point, send a POST request to:

```bash
curl -X POST http://localhost:3001/reset
```
This will also be done at the end of process flow

---

## 📸 Notes on Uploads

Uploaded files will appear in the `uploads/` directory. This is just for development—ensure production environments handle file storage securely.

