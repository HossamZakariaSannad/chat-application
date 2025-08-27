import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Inbox from './Inbox';

export default function Layout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) return <div style={{ padding: '10px', color: '#666' }}>Loading...</div>;

  if (!user && router.pathname !== '/login' && router.pathname !== '/register') {
    router.push('/login');
    return null;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f0f0' }}>
      {user && (
        <div style={{ width: '33.33%', borderRight: '1px solid #ccc', padding: '10px', backgroundColor: '#f5f5f5' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>Inbox</h2>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            style={{ width: '100%', padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px' }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#c82333')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#dc3545')}
          >
            Logout
          </button>
          <Inbox />
        </div>
      )}
      <div style={{ width: user ? '66.67%' : '100%', padding: '10px' }}>{children}</div>
    </div>
  );
}