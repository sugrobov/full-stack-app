import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts, setCurrentPage, filterProducts } from '../store/productsSlice';
import ProductCard from '../components/ProductCard';
import Breadcrumb from '../components/Breadcrumb';
import Filters from '../components/Filters';

const HomePage = () => {
  const dispatch = useDispatch();
  const { 
    filteredItems, 
    status, 
    currentPage, 
    itemsPerPage,
    searchQuery,
    selectedCategory,
    minPrice,
    maxPrice 
  } = useSelector(state => state.products);

  // Загружаем товары при монтировании
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProducts());
    }
  }, [dispatch, status]);

  // Фильтруем товары при изменении фильтров
  useEffect(() => {
    dispatch(filterProducts());
  }, [searchQuery, selectedCategory, minPrice, maxPrice, dispatch]);

  // Рассчитываем пагинацию
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    dispatch(setCurrentPage(pageNumber));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Загрузка товаров...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-4">Ошибка загрузки товаров</div>
          <button
            onClick={() => dispatch(fetchProducts())}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb />
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-2">Каталог товаров</h1>
      <p className="text-gray-600 mb-8">Найдено товаров: {filteredItems.length}</p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters sidebar */}
        <div className="lg:col-span-1">
          <Filters />
        </div>

        {/* Products grid */}
        <div className="lg:col-span-3">
          {currentItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Товары не найдены</h3>
              <p className="text-gray-600">Попробуйте изменить параметры фильтрации</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentItems.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Назад
                    </button>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      // Показываем только несколько страниц вокруг текущей
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`px-3 py-2 rounded-md ${currentPage === pageNumber
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Вперед
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;