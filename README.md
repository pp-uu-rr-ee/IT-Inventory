# IT Inventory Management System

A full-stack web application designed to help businesses efficiently manage their IT assets, equipment, and inventory. Built with modern web technologies, this system provides role-based access for warehouse managers and staff to streamline operations.

This project was developed as part of a Web Programming course at university, in collaboration with one teammate

## Features

- **Role-Based Access Control:** Distinct roles for Warehouse Managers and Warehouse Staff.
- **Product Management:** Add, edit, delete, and view IT equipment and inventory.
- **Inventory Transactions:** Track Stock-In and Stock-Out movements with detailed history.
- **Dashboard & Reports:** View inventory summaries, monthly transaction reports, and total asset values.
- **Low Stock Alerts:** Automatic notifications for items running below minimum stock thresholds.
- **Category Management:** Organize items into customizable categories.

## Tech Stack

- **Frontend:** Next.js, React, Lucide React
- **Backend:** Node.js, Express.js
- **Database:** SQLite

## Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Running the Application

The project includes convenient scripts to start both the frontend and backend servers simultaneously.

#### Windows

1. Right-click on the `run.bat` file in the root directory.
2. Select **Run as administrator**.

#### Or

1. Open Command Prompt.
2. cd path/to/your/project.
3. Run npm install for both backend and frontend.
4. Run npm run dev for both backend and frontend.
5. Open http://localhost:3000 in your browser.

## Default Login Credentials

You can use the following default accounts to log into the system:

| Role                  | Email             | Password |
| :-------------------- | :---------------- | :------- |
| **Warehouse Manager** | `admin@gmail.com` | `1234`   |
| **Warehouse Staff**   | `staff@gmail.com` | `1234`   |
