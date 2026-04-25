import axios from 'axios';
import store from '../store/store';
import { logout } from '../store/authSlice';

// Перехватчик ответов
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Очищаем состояние аутентификации
      store.dispatch(logout());
      // Перенаправляем на страницу входа
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;