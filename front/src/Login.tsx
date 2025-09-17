import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login () {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Network Error');
    }
  };

  return (
    <>
      <div className="flex flex-col w-full h-full items-center justify-center">
        <div className="text-2xl">Login</div>
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <label>Username:</label>
          <input 
            className="border border-gray-400 rounded" 
            name="username" 
            type="text" 
            required
            onChange={e => setUsername(e.target.value)}
          />
          <label>Password:</label>
          <input 
            className="border border-gray-400 rounded" 
            name="password" 
            type="password" 
            required
            onChange={e => setPassword(e.target.value)}
          />
          <button 
            className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white px-4 py-2 mt-4 rounded"
          >Submit</button>
        </form>
        {error && <p className="text-red-500 mb-2">{error}</p>}
      </div>
    </>
  )
}

export default Login;
