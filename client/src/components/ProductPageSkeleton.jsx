import React from 'react';

const ProductPageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Хлебные крошки */}
      <div className="flex items-center mb-6">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <div className="mx-2 w-4 h-4 bg-gray-200 rounded"></div>
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>
      
      {/* Основная сетка */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Левая колонка - изображение */}
          <div>
            <div className="relative mb-4">
              <div className="w-full h-96 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="flex justify-center space-x-2 mt-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-16 h-16 bg-gray-200 rounded-md"></div>
              ))}
            </div>
          </div>
          
          {/* Правая колонка - детали */}
          <div>
            {/* Категория */}
            <div className="mb-4">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
            
            {/* Рейтинг */}
            <div className="flex items-center mb-4">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 bg-gray-200 rounded-full"></div>
                ))}
              </div>
              <div className="ml-2 h-4 w-8 bg-gray-200 rounded"></div>
            </div>
            
            {/* Цена */}
            <div className="mb-6">
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
            
            {/* Наличие */}
            <div className="mb-6">
              <div className="flex items-center">
                <div className="h-4 w-16 bg-gray-200 rounded mr-2"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
            
            {/* Описание */}
            <div className="mb-6 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
            
            {/* Кнопки */}
            <div className="flex flex-wrap gap-4">
              <div className="h-12 bg-gray-200 rounded w-40"></div>
              <div className="h-12 bg-gray-200 rounded w-40"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPageSkeleton;