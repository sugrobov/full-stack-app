import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setPriceFilter, setSelectedCategory } from '../store/productsSlice';
import Input from './UI/Input';
import Select from './UI/Select';
import Button from './UI/Button';

const Filters = () => {
  const dispatch = useDispatch();
  const { categories, minPrice, maxPrice, selectedCategory } = useSelector(state => state.products);
  
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  const handleCategoryChange = (e) => {
    dispatch(setSelectedCategory(e.target.value));
  };

  const handlePriceChange = () => {
    dispatch(setPriceFilter({ minPrice: localMinPrice, maxPrice: localMaxPrice }));
  };

  const handleResetFilters = () => {
    dispatch(setSelectedCategory(''));
    dispatch(setPriceFilter({ minPrice: '', maxPrice: '' }));
    setLocalMinPrice('');
    setLocalMaxPrice('');
  };

  useEffect(() => {
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Фильтры</h2>
      
      {/* Категория */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
        <Select value={selectedCategory} onChange={handleCategoryChange}>
          <option value="">Все категории</option>
          {categories.map((category, index) => (
            <option key={index} value={category}>{category}</option>
          ))}
        </Select>
      </div>
      
      {/* Цена */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Цена</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">От</label>
            <Input
              type="number"
              placeholder="0"
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">До</label>
            <Input
              type="number"
              placeholder="10000"
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
            />
          </div>
        </div>
        <Button className="mt-3 w-full" onClick={handlePriceChange}>
          Применить цену
        </Button>
      </div>
      
      <Button variant="secondary" className="w-full" onClick={handleResetFilters}>
        Сбросить фильтры
      </Button>
    </div>
  );
};

export default Filters;