import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearCart } from '../store/cartSlice';
import { clearFilters } from '../store/productsSlice';
import Button from './UI/Button';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { totalQuantity } = useSelector(state => state.cart);
  const favorites = useSelector(state => state.favorites.items);

  const handleLogout = () => {
    dispatch(clearCart());
    dispatch(clearFilters());
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-blue-600">Мой магазин</Link>
        
        <nav className="flex items-center space-x-6">
          <Link to="/favorites" className="relative">
            <svg className="w-6 h-6 text-gray-600 hover:text-red-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {favorites.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </Link>
          
          <Link to="/cart" className="relative">
            <svg className="w-6 h-6 text-gray-600 hover:text-blue-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6M9 21a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            {totalQuantity > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalQuantity}
              </span>
            )}
          </Link>
          
          <Button variant="secondary" onClick={handleLogout}>
            Выйти
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;