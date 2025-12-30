import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSearchQuery, setPriceFilter, setSelectedCategory, filterProducts, setCurrentPage } from '../store/productsSlice';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import Button from '../components/UI/Button';
import Select from '../components/UI/Select';
import Input from '../components/UI/Input';
import Breadcrumb from '../components/Breadcrumb';

const HomePage = () => {
  const dispatch = useDispatch();
  const { filteredItems, categories, currentPage, itemsPerPage, searchQuery, minPrice, maxPrice, selectedCategory } = useSelector(state => state.products);

  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
/*   const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage); */

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(filterProducts());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, minPrice, maxPrice, selectedCategory, dispatch]);

  const handleSearchChange = (e) => {
    dispatch(setSearchQuery(e.target.value));
  };

  const handleClearSearch = () => {
    dispatch(setSearchQuery(''));
  };

  const handlePriceFilter = () => {
    dispatch(setPriceFilter({ minPrice: localMinPrice, maxPrice: localMaxPrice }));
  };

  const handleClearFilters = () => {
    setLocalMinPrice('');
    setLocalMaxPrice('');
    dispatch(setSelectedCategory(''));
    dispatch(setPriceFilter({ minPrice: '', maxPrice: '' }));
    dispatch(setSearchQuery(''));
  };

  const handlePageChange = (pageNumber) => {
    dispatch(setCurrentPage(pageNumber));
    window.scrollTo(0, 0);
  };

  // Filter products by selected category
  const filteredByCategory = selectedCategory
    ? filteredItems.filter(item => item.category === selectedCategory)
    : filteredItems;

  const displayedItems = filteredByCategory.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      <h1 className="text-3xl font-bold text-gray-800 mb-8">Каталог товаров</h1>

      {/* Desktop Search and Filters */}
      <div className="hidden md:block bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Search */}
          <div className="md:col-span-2">
            <Input
              label="Поиск"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Поиск товаров..."
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <Select
              label="Категория"
              value={selectedCategory}
              onChange={(e) => dispatch(setSelectedCategory(e.target.value))}
            >
              <option value="">Все категории</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </Select>
          </div>

          {/* Empty column for spacing */}
          <div></div>
        </div>

        {/* Desktop Price Inputs and Filter Buttons - кнопки на новой строке */}
        <div className="mt-6">
          {/* Price Inputs - в одной строке */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Input
                label="Минимальная цена"
                type="number"
                value={localMinPrice}
                onChange={(e) => setLocalMinPrice(e.target.value)}
                placeholder="От"
              />
            </div>

            <div>
              <Input
                label="Максимальная цена"
                type="number"
                value={localMaxPrice}
                onChange={(e) => setLocalMaxPrice(e.target.value)}
                placeholder="До"
              />
            </div>
          </div>

          {/* Filter Buttons - на новой строке с выравниванием по центру */}
          <div className="flex justify-center space-x-2">
            <Button
              variant="primary"
              onClick={handlePriceFilter}
              className="whitespace-nowrap"
            >
              Фильтровать
            </Button>
            <Button
              variant="secondary"
              onClick={handleClearFilters}
              className="px-3"
              title="Очистить фильтры"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Products */}
      {displayedItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {displayedItems.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredByCategory.length / itemsPerPage)}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">Товары не найдены</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;