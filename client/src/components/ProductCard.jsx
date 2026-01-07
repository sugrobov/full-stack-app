import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import Button from './UI/Button';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const isColor = typeof product.images?.[0] === 'string' && product.images[0].startsWith('hsl(');
  const isGradient = typeof product.images?.[0] === 'string' && product.images[0].startsWith('linear-gradient');

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart(product));
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <Link to={`/product/${product.id}`} className="flex-grow flex flex-col">
        {/* Product Image */}
        <div className="relative h-56 overflow-hidden bg-gray-100">
          <div
            className="w-full h-full flex items-center justify-center"
            style={isGradient ? { background: product.images[0] } :
                  isColor ? { backgroundColor: product.images[0] } : {}}
          >
            {isColor ? (
              <div className="text-white font-bold text-xl p-4 text-center">
                Товар #{product.id}
                <div className="text-sm mt-2">Изображение 1</div>
              </div>
            ) : isGradient ? (
              <div className="text-white font-bold text-xl p-4 text-center">
                Товар #{product.id}
                <div className="text-sm mt-2">Изображение 1</div>
              </div>
            ) : (
              <img
                src={product.images?.[0] || product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          
          {/* Discount badge */}
          {product.discountPrice && (
            <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              -{Math.round((1 - product.discountPrice / product.price) * 100)}%
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 flex-grow flex flex-col">
          {/* Category */}
          <div className="mb-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {product.category}
            </span>
          </div>
          
          {/* Product Name */}
          <h3 className="font-medium text-gray-800 text-sm mb-2 line-clamp-2 h-10">
            {product.name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center mb-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <span className="ml-1 text-xs text-gray-600">{product.rating}</span>
          </div>
          
          {/* Price */}
          <div className="mt-auto">
            {product.discountPrice ? (
              <div className="space-y-1">
                <div className="text-lg font-bold text-gray-800">
                  {product.discountPrice.toLocaleString()} ₽
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 line-through">
                    {product.price.toLocaleString()} ₽
                  </span>
                  <span className="ml-2 text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                    Экономия {(product.price - product.discountPrice).toLocaleString()} ₽
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-lg font-bold text-gray-800">
                {product.price.toLocaleString()} ₽
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart Button */}
      <div className="p-4 pt-0">
        <Button
          variant={product.stock === 0 ? "secondary" : "primary"}
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="w-full py-2 text-sm"
        >
          {product.stock === 0 ? 'Нет в наличии' : 'В корзину'}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;