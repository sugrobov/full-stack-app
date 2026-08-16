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
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

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
    }
  }, [items.length, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Кастомная валидация
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Имя обязательно';
    if (!email.trim()) newErrors.email = 'Email обязателен';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = 'Некорректный email';
    if (!address.trim()) newErrors.address = 'Адрес обязателен';
    if (!phone.trim()) newErrors.phone = 'Телефон обязателен';

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    setValidationErrors({});
    setLoading(true);

    const orderItems = items.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      price: Number(item.discountPrice) || Number(item.price),
    }));

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || '/api'}/orders`,
        { name, email, address, phone, items: orderItems },
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

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Данные для доставки</h2>
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 mb-2">Ваше имя</label>
          <input
            id="name"
            data-testid="checkout-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          {validationErrors.name && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="address" className="block text-gray-700 mb-2">Адрес доставки *</label>
          <input
            id="address"
            data-testid="checkout-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          {validationErrors.address && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
          )}
        </div>
        <div className="mb-6">
          <label htmlFor="phone" className="block text-gray-700 mb-2">Телефон</label>
          <input
            id="phone"
            data-testid="checkout-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          {validationErrors.phone && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 mb-2">Email *</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            data-testid="checkout-email"
          />
          {validationErrors.email && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
          )}
        </div>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <Button type="submit" disabled={loading} variant="primary" className="w-full" data-testid="submit-order">
          Подтвердить заказ
        </Button>
      </form>
    </div>
  );
};

export default CheckoutPage;