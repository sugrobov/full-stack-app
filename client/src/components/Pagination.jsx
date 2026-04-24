import React from 'react';
import Button from './UI/Button';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Вычисление диапазона отображаемых товаров
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Информация о диапазоне товаров */}
      <div className="text-sm text-gray-600">
        Показаны {startItem}–{endItem} из {totalItems} товаров
      </div>

      <div className="flex justify-center items-center space-x-2">
        {/* Previous Button */}
        <Button
          variant="secondary"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Назад
        </Button>

        {/* Page Numbers */}
        {getPageNumbers().map((page, index) => (
          <Button
            key={index}
            variant={page === currentPage ? "primary" : "secondary"}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
          >
            {page}
          </Button>
        ))}

        {/* Next Button */}
        <Button
          variant="secondary"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Вперед
        </Button>
      </div>
    </div>
  );
};

export default Pagination;