import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts, fetchCategories, setCurrentPage, setFiltersFromURL } from '../store/productsSlice';
import ProductCard from '../components/ProductCard';
import Breadcrumb from '../components/Breadcrumb';
import Filters from '../components/Filters';
import Pagination from '../components/Pagination';
import ProductSearch from '../components/ProductSearch';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import SortSelect from '../components/SortSelect';
import ResetFiltersButton from '../components/ResetFiltersButton';

const HomePage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, status, currentPage, totalPages, totalItems, selectedCategory, minPrice, maxPrice, sort } = useSelector(state => state.products);

  // При монтировании читаем URL и обновляем Redux состояние
  useEffect(() => {
    const category = searchParams.get('category') || '';
    const minPriceParam = searchParams.get('minPrice') || '';
    const maxPriceParam = searchParams.get('maxPrice') || '';
    const page = searchParams.get('page') || '1';
    const sortParam = searchParams.get('sort') || 'default';

    dispatch(setFiltersFromURL({
      category,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      page,
      sort: sortParam,
    }));
  }, []);

  // Загрузка категорий
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Загрузка товаров при изменении фильтров
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch, currentPage, selectedCategory, minPrice, maxPrice, sort]);

  // Синхронизация URL с Redux состоянием (когда фильтры меняются через интерфейс)
  useEffect(() => {
    const params = {};
    if (selectedCategory) params.category = selectedCategory;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (currentPage > 1) params.page = currentPage;
    if (sort && sort !== 'default') params.sort = sort;

    setSearchParams(params, { replace: true });
  }, [selectedCategory, minPrice, maxPrice, currentPage, sort, setSearchParams]);

  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
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
      <div className="flex justify-between items-center mb-8  flex-wrap gap-4">
        <p className="text-gray-600">Найдено товаров: {totalItems}</p>
        <SortSelect />
        <ResetFiltersButton />
      </div>

      <ProductSearch />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Filters />
        </div>

        <div className="lg:col-span-3">
          {items.length === 0 ? (
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
                {items.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;