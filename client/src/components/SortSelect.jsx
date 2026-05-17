import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSort } from '../store/productsSlice';

const SortSelect = () => {
  const dispatch = useDispatch();
  const sort = useSelector(state => state.products.sort);

  const handleSortChange = (e) => {
    dispatch(setSort(e.target.value));
  };

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="sort" className="text-sm font-medium text-gray-700">
        Сортировать:
      </label>
      <select
        id="sort"
        value={sort}
        onChange={handleSortChange}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="default">По умолчанию</option>
        <option value="price_asc">Цена: по возрастанию</option>
        <option value="price_desc">Цена: по убыванию</option>
        <option value="rating_desc">По рейтингу</option>
        <option value="newest">Сначала новинки</option>
      </select>
    </div>
  );
};

export default SortSelect;