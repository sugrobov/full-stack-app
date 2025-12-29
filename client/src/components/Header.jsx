import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setSearchQuery, setSelectedCategory, setPriceFilter } from '../store/productsSlice';
import Button from './UI/Button';
import Select from './UI/Select';
import Input from './UI/Input';

const Header = () => {
    const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [showTopIndicator, setShowTopIndicator] = useState(false);
  const closeMenuTimerRef = useRef(null);

  const cartItemsCount = useSelector(state => state.cart.totalQuantity);
  const searchQuery = useSelector(state => state.products.searchQuery);
  const categories = useSelector(state => state.products.categories);
  const selectedCategory = useSelector(state => state.products.selectedCategory);
  const minPrice = useSelector(state => state.products.minPrice);
  const maxPrice = useSelector(state => state.products.maxPrice);

  const [localMinPrice, setLocalMinPrice] = useState(minPrice || '');
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice || '');

  const toggleMenu = () => {
    // Если мы не в самом верху и меню закрыто, сначала скроллим наверх
    if (!isAtTop && !isMenuOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setShowTopIndicator(true);
      
      // Ждем завершения скролла, затем открываем меню
      setTimeout(() => {
        setIsMenuOpen(true);
        setShowTopIndicator(false);
      }, 400); // Время на скролл + небольшая задержка
    } else {
      // Если уже наверху или меню открыто - обычное поведение
      if (closeMenuTimerRef.current) {
        clearTimeout(closeMenuTimerRef.current);
        closeMenuTimerRef.current = null;
      }
      setIsMenuOpen(!isMenuOpen);
    }
  };

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // Обработчики фильтров
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

  useEffect(() => {
    setLocalMinPrice(minPrice || '');
    setLocalMaxPrice(maxPrice || '');
  }, [minPrice, maxPrice]);

  // Эффект для отслеживания позиции скролла
  useEffect(() => {
    let scrollTimeout;
    
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const atTop = scrollTop < 50; // Порог 50px от верха
      
      setIsAtTop(atTop);
      
      // Если мы проскроллили и не наверху, скрываем индикатор
      if (scrollTop > 50) {
        setShowTopIndicator(false);
      }
      
      // Закрываем меню при скролле (если оно открыто)
      if (isMenuOpen) {
        if (closeMenuTimerRef.current) {
          clearTimeout(closeMenuTimerRef.current);
        }
        closeMenuTimerRef.current = setTimeout(() => {
          closeMenu();
        }, 150);
      }
    };

    const handleResize = () => {
      if (isMenuOpen) {
        closeMenu();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (closeMenuTimerRef.current) {
        clearTimeout(closeMenuTimerRef.current);
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [isMenuOpen, closeMenu]);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">Интернет Магазин</Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">Главная</Link>
            <Link to="/cart" className="text-gray-700 hover:text-blue-600 font-medium flex items-center">
              Корзина
              {cartItemsCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">Обратная связь</Link>
          </nav>

          {/* Mobile menu button with visual feedback */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Indicator for "need to scroll up" */}
            {showTopIndicator && !isAtTop && (
              <span className="text-xs text-blue-600 animate-pulse">
                Скроллим наверх...
              </span>
            )}
            
            {/* Visual indicator when not at top */}
            {!isAtTop && !isMenuOpen && (
              <span className="text-xs text-gray-500 hidden sm:inline">
                Нажмите, чтобы скроллить наверх
              </span>
            )}
            
            <button
              onClick={toggleMenu}
              className={`
                text-gray-700 hover:text-blue-600 focus:outline-none
                transition-all duration-200
                ${!isAtTop && !isMenuOpen ? 'opacity-80 hover:opacity-100' : ''}
              `}
              title={!isAtTop && !isMenuOpen ? "Нажмите для скролла наверх и открытия меню" : "Открыть меню"}
            >
              <div className="relative">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
                
                {/* Animated dot when not at top */}
                {!isAtTop && !isMenuOpen && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t bg-gray-50 z-50">
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
              
              {/* Filter options for mobile */}
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
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
};

export default Header;