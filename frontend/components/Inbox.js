import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Inbox() {
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      console.log('Inbox: No user, skipping fetch');
      return;
    }
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Inbox: Fetching conversations with token:', token);
        const conversationsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Inbox: Conversations fetched:', conversationsRes.data);
        setConversations(conversationsRes.data);

        console.log('Inbox: Fetching users with token:', token);
        const usersRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Inbox: Users fetched:', usersRes.data);
        setUsers(usersRes.data.filter((u) => u.id !== user.id));
      } catch (err) {
        console.error('Inbox: Error fetching data:', err.response?.data?.error || err.message);
        setError('Failed to load data');
      }
    };
    fetchData();
  }, [user]);

  const startConversation = async () => {
    if (!selectedUserId) {
      setError('Select a user to start a conversation');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      console.log('Inbox: Starting conversation with userId:', selectedUserId);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversations`,
        { participantId: parseInt(selectedUserId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Inbox: Conversation created:', res.data);
      const conversationsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(conversationsRes.data);
      setSelectedUserId('');
      setError('');
      router.push(`/chat/${res.data.conversationId}`);
    } catch (err) {
      console.error('Inbox: Error starting conversation:', err.response?.data?.error || err.message);
      setError(err.response?.data?.error || 'Failed to start conversation');
    }
  };

  return (
    <div className="inbox-container">
      <h2 className="inbox-header">Inbox</h2>
      <div className="mb-4 flex items-center gap-2">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="user-select"
        >
          <option value="">Select a user</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username} (ID: {user.id})
            </option>
          ))}
        </select>
        <button
          onClick={startConversation}
          className="start-chat-btn"
        >
          Start Chat
        </button>
      </div>
      {error && <p className="error-message">{error}</p>}
      {conversations.length === 0 && (
        <p className="no-conversations">No conversations yet</p>
      )}
      {conversations.map((conv, index) => (
        <div
          key={conv.id}
          onClick={() => {
            console.log('Inbox: Navigating to chat:', conv.id);
            router.push(`/chat/${conv.id}`);
          }}
          className="conversation-card"
        >
          <p className="user-name">{conv.participants.join(', ')}</p>
          <p className="last-message">{conv.lastMessage || 'No messages yet'}</p>
          <p className="timestamp">
            {new Date(conv.lastTimestamp).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}