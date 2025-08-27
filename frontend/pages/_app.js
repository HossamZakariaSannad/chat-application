import { AuthProvider } from '../context/AuthContext';
import Layout from '../components/Layout';
import '../styles/styles.css';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}