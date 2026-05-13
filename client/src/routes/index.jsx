import HomePage from '../pages/HomePage';
import ProductPage from '../pages/ProductPage';
import CartPage from '../pages/CartPage';
import ContactPage from '../pages/ContactPage';
import SearchPage from '../pages/SearchPage';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ProfilePage from '../pages/ProfilePage';
import CheckoutPage from '../pages/CheckoutPage';
import FavoritesPage from '../pages/FavoritesPage';
import AdminRoute from '../components/AdminRoute';
import AdminDashboard from '../pages/Admin/AdminDashboard';
import AdminProducts from '../pages/Admin/AdminProducts';
import AdminOrders from '../pages/Admin/AdminOrders';
import AdminUsers from '../pages/Admin/AdminUsers';
import AdminReviews from '../pages/Admin/AdminReviews';
import AdminProductEdit from '../pages/Admin/AdminProductEdit';

const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/product/:id', element: <ProductPage /> },
  { path: '/cart', element: <CartPage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/search', element: <SearchPage /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/checkout', element: <CheckoutPage /> },
  { path: '/favorites', element: <FavoritesPage /> },
  { path: '/admin', element: <AdminRoute><AdminDashboard /></AdminRoute> },
  { path: '/admin/products', element: <AdminRoute><AdminProducts /></AdminRoute> },
  { path: '/admin/orders', element: <AdminRoute><AdminOrders /></AdminRoute> },
  { path: '/admin/users', element: <AdminRoute><AdminUsers /></AdminRoute> },
  { path:'/admin/reviews', element: <AdminRoute><AdminReviews /></AdminRoute>},
  { path:'/admin/products/:id/edit', element : <AdminRoute><AdminProductEdit /></AdminRoute>},
];

export default routes;