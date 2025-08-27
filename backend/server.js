const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { authenticateToken } = require('./utils/auth');
const prisma = require('./utils/prisma');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for development; restrict in production
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Serve static files from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Register
app.post('/api/auth/register', async (req, res) => {
  if (!req.body || !req.body.username || !req.body.password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { username, password: hashedPassword },
    });
    res.json({ message: 'User registered', userId: user.id });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ error: 'Username taken or invalid input' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  if (!req.body || !req.body.username || !req.body.password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Protected route: Get current user
app.get('/api/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// NEW: Get all users (for dropdown)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true },
    });
    res.json(users);
  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// POST /api/conversations: Start a one-to-one conversation
app.post('/api/conversations', authenticateToken, async (req, res) => {
  const { participantId } = req.body;
  if (!participantId || participantId === req.user.id) {
    return res.status(400).json({ error: 'Valid participantId required' });
  }
  try {
    // Validate participantId exists
    const participant = await prisma.user.findUnique({
      where: { id: participantId },
    });
    if (!participant) {
      return res.status(400).json({ error: 'Participant not found' });
    }
    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: req.user.id } } },
          { participants: { some: { userId: participantId } } },
        ],
      },
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId: req.user.id },
              { userId: participantId },
            ],
          },
        },
      });
    }
    res.json({ conversationId: conversation.id });
  } catch (error) {
    console.error('Conversation create error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// GET /api/conversations: List conversations for current user
app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: req.user.id } } },
      include: {
        participants: { include: { user: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { sender: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    const formatted = conversations.map((conv) => ({
      id: conv.id,
      participants: conv.participants.map((p) => p.user.username).filter((u) => u !== req.user.username),
      lastMessage: conv.messages[0]?.content || conv.messages[0]?.imageUrl || null,
      lastTimestamp: conv.messages[0]?.createdAt || conv.createdAt,
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Conversations list error:', error);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
});

// GET /api/conversations/:id/messages: List messages in a conversation
app.get('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: parseInt(id),
        participants: { some: { userId: req.user.id } },
      },
    });
    if (!conversation) {
      return res.status(403).json({ error: 'Unauthorized or conversation not found' });
    }
    const messages = await prisma.message.findMany({
      where: { conversationId: parseInt(id) },
      include: { sender: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      imageUrl: msg.imageUrl,
      sender: msg.sender.username,
      createdAt: msg.createdAt,
    })));
  } catch (error) {
    console.error('Messages list error:', error);
    res.status(500).json({ error: 'Failed to list messages' });
  }
});

// POST /api/conversations/:id/messages: Send a message
app.post('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { content, imageUrl } = req.body;
  if (!content && !imageUrl) {
    return res.status(400).json({ error: 'Content or imageUrl required' });
  }
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: parseInt(id),
        participants: { some: { userId: req.user.id } },
      },
      include: { participants: true },
    });
    if (!conversation) {
      return res.status(403).json({ error: 'Unauthorized or conversation not found' });
    }
    const message = await prisma.message.create({
      data: {
        content,
        imageUrl,
        senderId: req.user.id,
        conversationId: parseInt(id),
      },
      include: { sender: true },
    });
    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: parseInt(id) },
      data: { updatedAt: new Date() },
    });
    // Emit socket event to participants
    const participantIds = conversation.participants.map((p) => p.userId);
    participantIds.forEach((userId) => {
      io.to(`user:${userId}`).emit('new_message', {
        id: message.id,
        content: message.content,
        imageUrl: message.imageUrl,
        sender: message.sender.username,
        conversationId: message.conversationId,
        createdAt: message.createdAt,
      });
    });
    res.json({ messageId: message.id });
  } catch (error) {
    console.error('Message create error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /api/messages/upload: Upload image
app.post('/api/messages/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Image file required' });
  }
  const imageUrl = `${process.env.API_BASE_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Socket.IO: Handle connections and messages
io.use((socket, next) => {
  const token = socket.handshake.auth.token; // JWT sent in auth header
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    socket.user = user; // Attach user to socket
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`User ${socket.user.username} connected`);
  
  // Join user-specific room
  socket.join(`user:${socket.user.id}`);
  
  // Join all conversation rooms for the user
  prisma.conversation.findMany({
    where: { participants: { some: { userId: socket.user.id } } },
  }).then((conversations) => {
    conversations.forEach((conv) => {
      socket.join(`conversation:${conv.id}`);
    });
  });

  // Handle send_message event
  socket.on('send_message', async ({ conversationId, content, type }) => {
    if (!conversationId || (!content && type !== 'image') || !['text', 'image'].includes(type)) {
      socket.emit('error', 'Invalid message data');
      return;
    }
    try {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: parseInt(conversationId),
          participants: { some: { userId: socket.user.id } },
        },
        include: { participants: true },
      });
      if (!conversation) {
        socket.emit('error', 'Unauthorized or conversation not found');
        return;
      }
      const message = await prisma.message.create({
        data: {
          content: type === 'text' ? content : null,
          imageUrl: type === 'image' ? content : null,
          senderId: socket.user.id,
          conversationId: parseInt(conversationId),
        },
        include: { sender: true },
      });
      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: parseInt(conversationId) },
        data: { updatedAt: new Date() },
      });
      // Emit new_message to all participants
      const participantIds = conversation.participants.map((p) => p.userId);
      io.to(`conversation:${conversationId}`).emit('new_message', {
        id: message.id,
        content: message.content,
        imageUrl: message.imageUrl,
        sender: message.sender.username,
        conversationId: message.conversationId,
        createdAt: message.createdAt,
      });
    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.user.username} disconnected`);
  });
});

app.get('/', (req, res) => {
  res.send('Chat backend server is running!');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});