import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { loadUser } from '../store/authSlice';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatRelativeDate } from '../utils/dateUtils';

const ProfilePage = () => {
  const { user, token } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [searchParams] = useSearchParams();
  const orderSuccess = searchParams.get('orderSuccess');

  useEffect(() => {
    if (!user) navigate('/login');
    else {
      setName(user.name);
      setEmail(user.email);
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  useEffect(() => {
    if (orderSuccess === 'true') {
      setMessage('Заказ успешно оформлен!');
      // Убираем параметр из URL, не перезагружая страницу
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [orderSuccess]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/users/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/users/profile`, { name, email }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Профиль обновлён');
      dispatch(loadUser());
      setMessage('Профиль обновлён');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка обновления');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword.length < 6) {
      setError('Новый пароль должен быть не менее 6 символов');
      return;
    }
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/users/password`, { currentPassword, newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Пароль изменён');
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Пароль изменён');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка смены пароля');
    }
  };

   return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Личный кабинет</h1>
      {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Редактировать профиль</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-gray-700">Имя</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-700">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Сохранить изменения</button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Сменить пароль</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <input type="hidden" autoComplete="username" value={user?.email || ''} />
          <div>
            <label htmlFor="currentPassword" className="block text-gray-700">Текущий пароль</label>
            <input id="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-gray-700">Новый пароль (мин. 6 символов)</label>
            <input id="newPassword" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Сменить пароль</button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">История заказов</h2>
        {orders.length === 0 ? (
          <p className="text-gray-500">У вас пока нет заказов.</p>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              let itemsArray = [];
              try {
                itemsArray = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
              } catch (e) {
                console.error('Ошибка парсинга заказа', order.id, e);
                itemsArray = [];
              }
              return (
                <div key={order.id} className="border rounded p-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Заказ №{order.id}</span>
                    <span className="text-sm text-gray-500">{formatRelativeDate(order.created_at)}</span>
                  </div>
                  <div data-testid="order-total">Сумма: {order.total.toLocaleString()} ₽</div>
                  <div>Статус: {order.status === 'pending' ? 'Оформлен' : order.status}</div>
                  <div className="mt-2 text-sm text-gray-600">Адрес: {order.address}</div>
                  {order.items && itemsArray.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600">Состав заказа</summary>
                      <ul className="mt-2 pl-4">
                        {itemsArray.map((item, idx) => (
                          <li key={idx}>{item.name} x {item.quantity} = {item.price * item.quantity} ₽</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;