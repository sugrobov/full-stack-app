import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Панель администратора</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/products" className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">Товары</h2>
          <p className="text-gray-600">Управление каталогом товаров (CRUD)</p>
        </Link>
        <Link to="/admin/orders" className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">Заказы</h2>
          <p className="text-gray-600">Просмотр и изменение статусов заказов</p>
        </Link>
        <Link to="/admin/users" className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">Пользователи</h2>
          <p className="text-gray-600">Управление ролями пользователей</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;