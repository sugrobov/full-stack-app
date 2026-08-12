// client/src/pages/Admin/AdminUsers.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import BackToAdminButton from '../../components/UI/BackToAdminButton';
import Pagination from '../../components/Pagination';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const ITEMS_PER_PAGE = 10;

const AdminUsers = () => {
  const { token } = useSelector(state => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: ITEMS_PER_PAGE, totalPages: 1, totalItems: 0 });

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/users`, {
        params: { page, limit: ITEMS_PER_PAGE },
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      setUsers(Array.isArray(data.users) ? data.users : []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => setPage(newPage);

  const updateRole = async (userId, newRole) => {
    setUpdating(userId);
    try {
      await axios.put(`${API_URL}/admin/users/${userId}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (err) {
      console.error('Ошибка обновления роли:', err);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="text-center py-8" role="status" aria-label="Загрузка">Загрузка...</div>;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Управление пользователями</h1>
      <BackToAdminButton />

      <section aria-labelledby="users-table-heading" className="bg-white rounded-lg shadow overflow-x-auto">
        <h2 id="users-table-heading" className="sr-only">Список пользователей</h2>
        <table className="min-w-full divide-y divide-gray-200" aria-describedby="users-table-desc">
          <caption id="users-table-desc" className="sr-only">
            Таблица пользователей с возможностью изменения ролей и пагинацией
          </caption>
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата регистрации</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value)}
                    disabled={updating === user.id}
                    className="border rounded px-2 py-1 text-sm"
                    aria-label={`Роль пользователя ${user.name}`}
                  >
                    <option value="user">Пользователь</option>
                    <option value="admin">Администратор</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {/* Можно добавить кнопку удаления */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-6">
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.limit}
        />
      </div>
    </main>
  );
};

export default AdminUsers;