import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export default function ChatWindow({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!conversationId || !user) return;

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${conversationId}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(res.data);
      } catch (err) {
        setError('Failed to load messages');
      }
    };
    fetchMessages();

    // Initialize Socket.IO
    const token = localStorage.getItem('token');
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      auth: { token },
    });

    // Join conversation room
    socketRef.current.emit('join', { conversationId });

    // Listen for new messages
    socketRef.current.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on('error', (err) => {
      setError(err);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [conversationId, user]);

  const handleSend = async () => {
    if (!newMessage.trim() && !imageFile) return;
    try {
      let imageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const token = localStorage.getItem('token');
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/messages/upload`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        imageUrl = res.data.imageUrl;
      }

      const messageData = {
        conversationId,
        content: imageUrl || newMessage,
        type: imageUrl ? 'image' : 'text',
      };

      socketRef.current.emit('send_message', messageData);
      setNewMessage('');
      setImageFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Chat</h2>
      {error && <p className="text-red-500">{error}</p>}
      <div className="flex-1 overflow-y-auto border p-4 mb-4 rounded">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <strong>{msg.sender}: </strong>
            {msg.content && <span>{msg.content}</span>}
            {msg.imageUrl && (
              <img src={msg.imageUrl} alt="Message" className="max-w-xs mt-1" />
            )}
            <span className="text-sm text-gray-400 ml-2">
              {new Date(msg.createdAt).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border p-2 rounded mr-2"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          className="mr-2"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}