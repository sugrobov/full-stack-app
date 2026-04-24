import React from 'react';

const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full animate-pulse">
      {/* Изображение */}
      <div className="h-56 bg-gray-200"></div>

      {/* Контентная часть */}
      <div className="p-4 flex-grow flex flex-col">
        {/* Категория */}
        <div className="mb-2">
          <div className="h-5 w-20 bg-gray-200 rounded"></div>
        </div>

        {/* Название (2 строки) */}
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>

        {/* Рейтинг */}
        <div className="flex items-center mb-3">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-3 h-3 bg-gray-200 rounded-full"></div>
            ))}
          </div>
          <div className="ml-1 h-3 w-8 bg-gray-200 rounded"></div>
        </div>

        {/* Цена (две строки, как при скидке) */}
        <div className="mt-auto space-y-1">
          <div className="h-6 bg-gray-200 rounded w-24"></div>
          <div className="flex items-center">
            <div className="h-4 bg-gray-200 rounded w-16 mr-2"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>

      {/* Кнопка */}
      <div className="p-4 pt-0">
        <div className="h-9 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;