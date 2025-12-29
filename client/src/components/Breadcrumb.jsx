import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Breadcrumb = ({ productName }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  
  // Get product name from Redux store if not provided as prop
  const productId = pathnames[pathnames.indexOf('product') + 1];
  const product = useSelector(state =>
    productId ? state.products.items.find(item => item.id === parseInt(productId)) : null
  );

  // Generate breadcrumb items
  const breadcrumbs = [];
  
  // Add home link
  breadcrumbs.push({
    name: 'Главная',
    path: '/'
  });
  
  // Handle different routes
  if (location.pathname === '/') {
    // Home page - no additional breadcrumbs
  } else if (location.pathname.startsWith('/product/')) {
    // Product page
    breadcrumbs.push({
      name: 'Каталог товаров',
      path: '/'
    });
    
    if (product || productName) {
      breadcrumbs.push({
        name: product ? product.name : productName,
        path: location.pathname
      });
    }
  } else if (location.pathname === '/cart') {
    // Cart page
    breadcrumbs.push({
      name: 'Корзина',
      path: '/cart'
    });
  } else if (location.pathname === '/contact') {
    // Contact page
    breadcrumbs.push({
      name: 'Обратная связь',
      path: '/contact'
    });
  }

  return (
    <nav className="mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg className="w-4 h-4 text-gray-400 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            
            {index === breadcrumbs.length - 1 ? (
              <span className="text-gray-500 font-medium" aria-current="page">
                {breadcrumb.name}
              </span>
            ) : (
              <Link
                to={breadcrumb.path}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {breadcrumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;