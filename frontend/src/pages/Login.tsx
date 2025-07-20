import React from 'react';
import { useAuth } from '../AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to Legatia</h1>
      <img src="/legatia_logo_with_title.png" alt="Legatia Logo" style={{ width: '200px', margin: '20px 0' }} />
      <p>Please log in with your Internet Identity to continue.</p>
      <button onClick={login} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
        Login with Internet Identity
      </button>
    </div>
  );
};

export default Login;
