Chat Application
Project Overview
A simple chat application with an inbox feature allowing users to start and view conversations.
Tech Stack

Frontend: Next.js,  CSS
Backend: Node.js, Express
Database: MySQL
Other: Axios for API calls

DB Schema (Short)

Users: id (INT, PRIMARY KEY), username (VARCHAR(255), UNIQUE), password (VARCHAR(255), hashed)
Conversations: id (INT, PRIMARY KEY), participantIds (JSON), lastMessage (TEXT), lastTimestamp (DATETIME)
Messages: id (INT, PRIMARY KEY), conversationId (INT, FOREIGN KEY), senderId (INT, FOREIGN KEY), content (TEXT), timestamp (DATETIME)

How to Run
Database Setup

Install MySQL:

Download and install MySQL Community Server (e.g., from mysql.com).
Ensure MySQL is running (default port: 3306).


Create Database and User:

Connect to MySQL (e.g., using mysql -u root -p).
Create the database:CREATE DATABASE chat_app;


Create a user and grant privileges:CREATE USER 'chat_user'@'localhost' IDENTIFIED BY '123123';
GRANT ALL PRIVILEGES ON chat_app.* TO 'chat_user'@'localhost';
FLUSH PRIVILEGES;




Set Up Environment Variables:

In backend/, create or update .env with:DATABASE_URL="mysql://chat_user:123123@localhost:3306/chat_app"
JWT_SECRET=hossam123123
PORT=5000


In frontend/, create or update .env.local with:NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000


Note: Replace 123123 with a secure password in production and adjust localhost if running on a different host.


Initialize Database Tables:

Run the following SQL commands to create tables:USE chat_app;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participantIds JSON NOT NULL,
  lastMessage TEXT,
  lastTimestamp DATETIME
);

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversationId INT NOT NULL,
  senderId INT NOT NULL,
  content TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  FOREIGN KEY (conversationId) REFERENCES conversations(id),
  FOREIGN KEY (senderId) REFERENCES users(id)
);


Ensure your backend code (e.g., using a library like mysql2 or sequelize) connects to this schema and handles password hashing (e.g., with bcrypt).



Backend

Navigate to backend/
Run npm install
Start with npm run dev

Frontend

Navigate to frontend/
Run npm install
Start with npm run dev
Visit http://localhost:3000

How to Test

Postman / cURL:
Register: curl -X POST http://localhost:5000/api/register -H "Content-Type: application/json" -d '{"username":"testuser1","password":"testpass"}'
Login: curl -X POST http://localhost:5000/api/login -H "Content-Type: application/json" -d '{"username":"testuser1","password":"testpass"}'
Fetch Conversations: curl -X GET http://localhost:5000/api/conversations -H "Authorization: Bearer <token>"
Start Conversation: curl -X POST http://localhost:5000/api/conversations -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"participantId":2}'


