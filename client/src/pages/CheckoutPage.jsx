import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearCart } from '../store/cartSlice';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '../components/UI/Button';

const CheckoutPage = () => {
  const { items } = useSelector(state => state.cart);
  const { user, token } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const computedTotal = items.reduce((sum, item) => {
    const price = Number(item.discountPrice) || Number(item.price) || 0;
    const quantity = Number(item.quantity) || 1;
    return sum + price * quantity;
  }, 0);

  const safeFormat = (value) => {
    const num = Number(value);
    return isNaN(num) ? '0' : num.toLocaleString();
  };

  useEffect(() => {
    if (items.length === 0) {
      navigate('/');
    } else if (!user) {
      navigate('/login');
    }
  }, [items.length, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const orderItems = items.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      price: Number(item.discountPrice) || Number(item.price),
    }));

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || '/api'}/orders`,
        { name, address, phone, items: orderItems },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(clearCart());
      navigate('/profile?orderSuccess=true');
      toast.success('Заказ оформлен! Спасибо за покупку');
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось оформить заказ');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 || !user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Оформление заказа</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Ваши товары</h2>
        <div className="space-y-3 mb-4">
          {items.map(item => (
            <div key={item.id} className="flex justify-between border-b pb-2">
              <span>{item.name} x {item.quantity}</span>
              <span>{safeFormat((Number(item.discountPrice) || Number(item.price)) * item.quantity)} ₽</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-2">
            <span>Итого:</span>
            <span>{safeFormat(computedTotal)} ₽</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Данные для доставки</h2>
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 mb-2">Ваше имя</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="address" className="block text-gray-700 mb-2">Адрес доставки *</label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="phone" className="block text-gray-700 mb-2">Телефон</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <Button type="submit" disabled={loading} variant="primary" className="w-full">
          Подтвердить заказ
        </Button>
      </form>
    </div>
  );
};

export default CheckoutPage;