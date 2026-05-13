import axios from 'axios';
import store from '../store/store';
import { logout } from '../store/authSlice';

// Перехватчик ответов
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('Axios interceptor caught error:', error.response ? error.response.status : error.message);
    if (error.response && error.response.status === 401) {
      console.log('Unauthorized, redirecting to login');
      // Очищаем состояние аутентификации
      store.dispatch(logout());
      // Перенаправляем на страницу входа
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;