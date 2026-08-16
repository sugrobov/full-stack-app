import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/authSlice';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading, error } = useSelector(state => state.auth);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (!result.error) {
      navigate('/');
    }
  };

  return (
    <main className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow" aria-labelledby="login-heading">
      <h2 id="login-heading" className="text-2xl font-bold mb-6">Вход</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label htmlFor="login-email" className="block text-gray-700">Email</label>
          <input
            id="login-email"
            data-testid="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="login-password" className="block text-gray-700">Пароль</label>
          <input
            id="login-password"
            data-testid="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        {error && <p className="text-red-500 mb-4" role="alert">{error}</p>}
        <button
          type="submit"
          data-testid="login-submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {isLoading ? 'Загрузка...' : 'Войти'}
        </button>
      </form>
      <p className="mt-4 text-center">
        Нет аккаунта? <Link to="/register" className="text-blue-600">Зарегистрироваться</Link>
      </p>
    </main>
  );
};

export default Login;