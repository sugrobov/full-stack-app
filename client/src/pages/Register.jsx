import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../store/authSlice';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
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
    const result = await dispatch(register({ name, email, password }));
    if (!result.error) {
      navigate('/');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Регистрация</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Имя</label>
          <input
            type="text"
            value={name}
            data-testid="register-name"
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            data-testid="register-email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Пароль (мин. 6 символов)</label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            data-testid="register-password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
            minLength={6}
          />
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          data-testid="register-submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {isLoading ? 'Загрузка...' : 'Зарегистрироваться'}
        </button>
      </form>
      <p className="mt-4 text-center">
        Уже есть аккаунт? <Link to="/login" className="text-blue-600">Войти</Link>
      </p>
    </div>
  );
};

export default Register;