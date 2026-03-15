# Event Management System

This project is a **full-stack Event Management Platform** built using the **MERN Stack (MongoDB, Express.js, React, Node.js)**.  
The goal of the system is to provide a centralized platform where participants can browse and register for events while organizers can create and manage events efficiently.

Instead of managing registrations through multiple Google Forms, spreadsheets, and messaging platforms, this application brings everything into a single system.

---

## MERN Stack

This project uses the MERN stack:

- **MongoDB** – Database used to store users, events, and registration data.
- **Express.js** – Backend framework used to build REST APIs.
- **React.js** – Frontend library used to create the user interface.
- **Node.js** – Runtime environment used to run the backend server.

---

## Features

### Participant
- Register and login to the platform
- Browse and search available events
- Register for events
- View upcoming and past events
- Manage personal profile

### Organizer
- Create new events
- Manage event details
- View participants registered for events

### Admin
- Manage organizers and system level operations

---

## Project Structure

```
event-management-system
│
├── A1_backend
│   ├── controllers
│   ├── models
│   ├── routes
│   └── server.js
│
├── A1_frontend
│   ├── src
│   └── public
│
└── README.md
```

---

## Running the Project

### 1. Clone the repository

```bash
git clone https://github.com/keshviagrawal/event-management-system.git
cd event-management-system
```

---

### 2. Run the Backend

```bash
cd A1_backend
npm install
npm run dev
```

Backend will start on:

```
http://localhost:5000
```

---

### 3. Run the Frontend

Open a new terminal and run:

```bash
cd A1_frontend
npm install
npm run dev
```

Frontend will start on:

```
http://localhost:5173
```

---

## Environment Variables

Create a `.env` file inside the backend folder and add:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

---

## Technologies Used

- React
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- bcrypt
- Axios
