import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import TableSkeleton from '../../components/UI/TableSkeleton';
import BackToAdminButton from '../../components/UI/BackToAdminButton';
import Pagination from '../../components/Pagination';

const API_URL = import.meta.env.VITE_API_URL;
const ITEMS_PER_PAGE = 10;

const AdminOrders = () => {
  const { token } = useSelector(state => state.auth);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  // Фильтры
  const [statusFilter, setStatusFilter] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: ITEMS_PER_PAGE, totalPages: 1, totalItems: 0 });

  useEffect(() => {
    fetchOrders();
  }, [page]);

  useEffect(() => {
    applyFilters();
  }, [orders, statusFilter, emailSearch, dateFrom, dateTo]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/orders`, {
        params: { page, limit: ITEMS_PER_PAGE },
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Ошибка загрузки заказов:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const applyFilters = () => {
    let filtered = [...orders];
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    if (emailSearch) {
      filtered = filtered.filter(order => order.user_email.toLowerCase().includes(emailSearch.toLowerCase()));
    }
    if (dateFrom) {
      filtered = filtered.filter(order => new Date(order.created_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(order => new Date(order.created_at) <= new Date(dateTo));
    }
    setFilteredOrders(filtered);
  };

  const resetFilters = () => {
    setStatusFilter('');
    setEmailSearch('');
    setDateFrom('');
    setDateTo('');
  };

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await axios.put(`${API_URL}/admin/orders/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (err) {
      console.error('Ошибка обновления статуса:', err);
    } finally {
      setUpdating(null);
    }
  };

  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'pending', label: 'Ожидает' },
    { value: 'paid', label: 'Оплачен' },
    { value: 'shipped', label: 'Отправлен' },
    { value: 'delivered', label: 'Доставлен' },
    { value: 'cancelled', label: 'Отменён' }
  ];

  if (loading) return <TableSkeleton columns={7} rows={5} />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Управление заказами</h1>
      <BackToAdminButton />
      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Фильтры</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border p-2 rounded">
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input type="text" placeholder="Email пользователя" value={emailSearch} onChange={(e) => setEmailSearch(e.target.value)} className="border p-2 rounded" />
          <input type="date" placeholder="Дата от" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border p-2 rounded" />
          <input type="date" placeholder="Дата до" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border p-2 rounded" />
        </div>
        <div className="mt-4">
          <button onClick={resetFilters} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Сбросить фильтры</button>
        </div>
      </div>

      {/* Таблица заказов */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сумма</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Адрес</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Состав</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.user_name}<br /><span className="text-xs text-gray-500">{order.user_email}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Number(order.total).toLocaleString()} ₽</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    disabled={updating === order.id}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="pending">Ожидает</option>
                    <option value="paid">Оплачен</option>
                    <option value="shipped">Отправлен</option>
                    <option value="delivered">Доставлен</option>
                    <option value="cancelled">Отменён</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{order.address}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <details className="cursor-pointer text-blue-600 hover:text-blue-800">
                    <summary>Детали</summary>
                    <div className="mt-2 p-2 bg-gray-50 rounded text-gray-700">
                      {order.items && order.items.map(item => (
                        <div key={item.id} className="text-xs">{item.name} x {item.quantity} = {item.price * item.quantity} ₽</div>
                      ))}
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      <div className="mt-6">
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.limit}
        />
      </div>
    </div>
  );
};

export default AdminOrders;