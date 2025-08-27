import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/inbox');
    }
  }, [user, router]);

  return (
    <div>
      <h1>Chat App</h1>
      <p>Redirecting to inbox...</p>
    </div>
  );
}