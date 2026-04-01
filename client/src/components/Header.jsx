import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setSearchQuery, setSelectedCategory, setPriceFilter } from '../store/productsSlice';
import Button from './UI/Button';
import Select from './UI/Select';
import Input from './UI/Input';

const Header = () => {
  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cartItemsCount = useSelector(state => state.cart.totalQuantity);
  const searchQuery = useSelector(state => state.products.searchQuery);
  const categories = useSelector(state => state.products.categories);
  const selectedCategory = useSelector(state => state.products.selectedCategory);
  const minPrice = useSelector(state => state.products.minPrice);
  const maxPrice = useSelector(state => state.products.maxPrice);

  const [localMinPrice, setLocalMinPrice] = useState(minPrice || '');
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice || '');

  const handleSearchChange = (e) => {
    dispatch(setSearchQuery(e.target.value));
  };

  const handleClearSearch = () => {
    dispatch(setSearchQuery(''));
  };

  const handleMinPriceChange = (e) => {
    setLocalMinPrice(e.target.value);
  };

  const handleMaxPriceChange = (e) => {
    setLocalMaxPrice(e.target.value);
  };

  const handleApplyFilters = () => {
    dispatch(setPriceFilter({ minPrice: localMinPrice || '', maxPrice: localMaxPrice || '' }));
  };

  const handleClearFilters = () => {
    setLocalMinPrice('');
    setLocalMaxPrice('');
    dispatch(setPriceFilter({ minPrice: '', maxPrice: '' }));
    dispatch(setSelectedCategory(''));
  };

  // Закрываем меню при клике на ссылку
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              Интернет Магазин
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Главная
            </Link>
            <Link to="/cart" className="text-gray-700 hover:text-blue-600 font-medium flex items-center">
              Корзина
              {cartItemsCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">
              Обратная связь
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t bg-gray-50">
            <nav className="flex flex-col space-y-4 px-4">
              <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium py-2" onClick={closeMenu}>
                Главная
              </Link>
              <Link to="/cart" className="text-gray-700 hover:text-blue-600 font-medium flex items-center py-2" onClick={closeMenu}>
                Корзина
                {cartItemsCount > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
              <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium py-2" onClick={closeMenu}>
                Обратная связь
              </Link>

              {/* Filter options for mobile (оставляем как есть) */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Фильтры</h3>
                <div className="space-y-3 pb-4">
                  <div>
                    <div className="relative">
                      <Input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Поиск товаров..."
                        className="pr-8 w-full"
                      />
                      {searchQuery && (
                        <button
                          onClick={handleClearSearch}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <Select
                      label="Категория"
                      value={selectedCategory}
                      onChange={(e) => {
                        const categoryId = e.target.value === 'all' ? '' : e.target.value;
                        dispatch(setSelectedCategory(categoryId));
                      }}
                      className="w-full"
                    >
                      <option value="all">Все категории</option>
                      {categories.map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        type="number"
                        placeholder="Мин цена"
                        value={localMinPrice}
                        onChange={handleMinPriceChange}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Макс цена"
                        value={localMaxPrice}
                        onChange={handleMaxPriceChange}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="primary" onClick={handleApplyFilters} className="flex-1 text-sm">
                      Применить
                    </Button>
                    <Button variant="secondary" onClick={handleClearFilters} className="flex-1 text-sm">
                      Сбросить
                    </Button>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;