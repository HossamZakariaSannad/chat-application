# Chat Application

## 📌 Project Overview
A simple chat application with an inbox feature allowing users to start and view conversations.

---

## 🛠 Tech Stack
- **Frontend:** Next.js, CSS  
- **Backend:** Node.js, Express  
- **Database:** MySQL  
- **Other:** Axios for API calls  

---

## 🗄 Database Schema (Short)

**Users**
- `id` (INT, PRIMARY KEY)  
- `username` (VARCHAR(255), UNIQUE)  
- `password` (VARCHAR(255), hashed)  

**Conversations**
- `id` (INT, PRIMARY KEY)  
- `participantIds` (JSON)  
- `lastMessage` (TEXT)  
- `lastTimestamp` (DATETIME)  

**Messages**
- `id` (INT, PRIMARY KEY)  
- `conversationId` (INT, FOREIGN KEY)  
- `senderId` (INT, FOREIGN KEY)  
- `content` (TEXT)  
- `timestamp` (DATETIME)  

---

## 🚀 How to Run

### 1️⃣ Database Setup

#### Install MySQL
- Download and install [MySQL Community Server](https://dev.mysql.com/downloads/).
- Ensure MySQL is running (default port: **3306**).

#### Create Database and User
```sql
CREATE DATABASE chat_app;

CREATE USER 'chat_user'@'localhost' IDENTIFIED BY '123123';
GRANT ALL PRIVILEGES ON chat_app.* TO 'chat_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Environment Variables

**Backend (`backend/.env`):**
```env
DATABASE_URL="mysql://chat_user:anypassword..@localhost:3306/chat_app"
JWT_SECRET=your secert key
PORT=5000
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

⚠️ Replace `123123` with a **secure password** in production.  

#### Initialize Database Tables
```sql
USE chat_app;

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
```

---

### 2️⃣ Backend Setup
```bash
cd backend
npm install
node server.js
```

---

### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Visit 👉 [http://localhost:3000](http://localhost:3000)

---

## 🧪 How to Test

### Using Postman or cURL

#### Register
```bash
curl -X POST http://localhost:5000/api/register -H "Content-Type: application/json" -d '{"username":"testuser1","password":"testpass"}'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/login -H "Content-Type: application/json" -d '{"username":"testuser1","password":"testpass"}'
```

#### Fetch Conversations
```bash
curl -X GET http://localhost:5000/api/conversations -H "Authorization: Bearer <token>"
```

#### Start Conversation
```bash
curl -X POST http://localhost:5000/api/conversations -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"participantId":2}'
```
#### Upload File to Conversation
```bash
curl -X POST http://localhost:5000/api/messages/upload -H "Authorization: Bearer <your_jwt_token>" -F "file=@/path/to/your/file.jpg" "
```
#### Send Message
```bash
curl -X POST http://localhost:5000/api/conversations/<id>/messagesa -H "Authorization: Bearer <your_jwt_token>" -H "Content-Type: application/json" -d '{"conversationId":1,"content":"Hello, this is a test message!"}'
```


