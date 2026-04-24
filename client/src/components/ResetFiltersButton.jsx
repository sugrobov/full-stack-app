import React from 'react';
import { useDispatch } from 'react-redux';
import { resetAllFilters } from '../store/productsSlice';
import Button from './UI/Button';

const ResetFiltersButton = () => {
  const dispatch = useDispatch();

  const handleReset = () => {
    dispatch(resetAllFilters());
  };

  return (
    <Button variant="secondary" onClick={handleReset} className="px-4 py-2">
      Сбросить всё
    </Button>
  );
};

export default ResetFiltersButton;