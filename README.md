# Smart Clinic & Pharmacy Flow Management System

A full-stack MERN application designed to streamline clinic operations, from intelligent patient queuing to efficient pharmacy inventory management. This system provides a comprehensive suite of tools for receptionists, doctors, and pharmacists to enhance patient care and operational workflow.

---

## Features

This project is divided into several 4 modules:

### Module 1: Intelligent Patient Flow & Queue Optimization
- **Add Walk-in Patients:** Staff can quickly register walk-in patients with essential details like name, age, and symptoms.
- **Dynamic Queue Prioritization:** Automatically reorder the patient queue based on urgency (e.g., keywords like “chest pain” or “bleeding”) using keyword tagging and rule-based scoring.
- **Wait Time Estimation:** Predict each patient’s expected wait time using average doctor consultation times and current queue state.
- **Queue Bottleneck Heatmap:** Display a real-time heatmap showing the busiest hours and doctor load over time using.

### Module 2: Doctor-Patient Session Manager
- **Consultation Management:** Doctors can select a patient from the queue, complete the consultation and keep notes.
- **Smart Consultation Timer:** Automatically track the consultation time, highlight if it exceeds standard duration (e.g., 10 min), and log exceptions.
- **Task Delegation:** Allow doctors to leave notes for other staff, assigning tasks like “Check vitals every 4 hours.” Tasks can be marked as done.
- **Doctor Summary Dashboard:** Generate real-time dashboards with each doctor’s patient count, average consultation time, and most common diagnoses.

### Module 3: Pharmacy Inventory & Expiry Tracker
- **Medicine Catalog:** Allow staff to enter and edit medicine records with fields such as: name, type etc, category (antibiotic, analgesic), quantity in stock, and supplier.
- **Batch & Expiry Tracking:** Track medicines by batch number, expiry date, and quantity per batch.
- **Expiry Alert System:** Automatically highlights medicines nearing their expiration date with color-coded warnings.
- **Inventory Dashboard:** Provide a dashboard with key stats: total items in stock, items below threshold, expired items, and most dispensed medicines this week/month.

### Module 4: Reports, Alerts, and Insights
- **Daily Operational Summary:** Automatically generates end-of-day reports summarizing total patients, consultation times, and prescriptions filled.
- **Symptom Frequency Charts:** Visualizes trends in patient symptoms over time to spot seasonal or emerging health issues.
- **Pharmacy Usage Analytics:** Tracks and visualizes medicine dispensing trends to guide procurement and stocking decisions.
- **Downloadable Reports:** All reports can be downloaded in PDF or CSV formats.

### EXTRA Module:
- **Patient Dashboard:** Doctors list from where one can choose which doctors appointment he or she might need (Requires RECEPTIONIST approval).
- **Patient Dashboard:** AI suggestion, enter symptoms to AI assistant so that the AI returns a Doctor recommendation.
- **Doctor Dashboard:** Shows his income. For every patient he sees, he will have an income stat card.


---

## Tech Stack

This project is built using the MERN stack with a modern development workflow.

- **Frontend:**
  - **React.js:** A powerful JavaScript library for building user interfaces.
  - **Vite:** A next-generation frontend tooling for a blazing-fast development experience.
  - **React Router:** For client-side routing and navigation.
  - **Axios:** For making asynchronous HTTP requests to the backend API.
  - **Styling:** Tailwind CSS (or standard CSS).

- **Backend:**
  - **Node.js:** A JavaScript runtime for building the server-side application.
  - **Express.js:** A fast, unopinionated, minimalist web framework for Node.js.
  - **MongoDB:** A NoSQL database for storing application data.
  - **Mongoose:** An Object Data Modeling (ODM) library for MongoDB and Node.js.

- **Authentication & Security:**
  - **JSON Web Tokens (JWT):** For securing API endpoints and managing user sessions.
  - **bcrypt.js:** For hashing user passwords before storing them in the database.

---

## Installation and Setup

To get a local copy up and running, follow these simple steps.

### Prerequisites
- Node.js installed on your machine.
- A MongoDB Atlas account or a local MongoDB installation.

### Setup Instructions

1. **Clone the repository:**
   ```sh
   git clone https://github.com/nayeemul-avancys/cse471-project-smartclinic
   cd smart-clinic-app
   ```

2. **Setup the Backend:**
   ```sh
   # Navigate to the backend folder
   cd backend

   # Install NPM packages
   npm install

   # Create a .env file in the backend folder
   # and add the following variables:
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_key

   # Start the backend server
   npm run dev
   ```

3. **Setup the Frontend:**
   ```sh
   # Navigate to the frontend folder from the root directory
   cd frontend

   # Install NPM packages
   npm install

   # Start the frontend development server
   npm run dev
   ```

Your application should now be running!
- The React frontend will be available at `http://localhost:5173` (or another port if 5173 is busy).
- The Node.js backend API will be running at `http://localhost:5000`.
