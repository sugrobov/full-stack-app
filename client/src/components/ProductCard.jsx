import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { toggleFavorite } from '../store/favoritesSlice';
import Button from './UI/Button';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const favorites = useSelector(state => state.favorites.items);

  const isFavorite = favorites.includes(product.id);

  const handleAddToCart = () => {
    dispatch(addToCart(product));
  };

  const handleToggleFavorite = () => {
    dispatch(toggleFavorite(product.id));
  };

  // const displayPrice = product.discountPrice || product.price;
  const isDiscounted = !!product.discountPrice;
  const productImages = product.images || [product.image];
  const isGradient = typeof productImages[0] === 'string' && productImages[0].startsWith('linear-gradient');

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Product Image */}
      <div className="relative overflow-hidden">
        <Link to={`/product/${product.id}`}>
          <div
            className="w-full h-48 flex items-center justify-center transition-transform duration-300 hover:scale-105"
            style={isGradient ? { background: productImages[0] } : {}}
          >
            {!isGradient && (
              <img
                src={productImages[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            )}
            {isGradient && (
              <div className="text-white font-bold text-lg">
                Товар #{product.id}
              </div>
            )}
          </div>
        </Link>
        {/* Favorite Button */}
        <Button
          variant="ghost"
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
        >
          <svg
            className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`}
            viewBox="0 0 20 20"
          >
            <path d="M10 18.5l-8.5-8.5c-1.5-1.5-1.5-3.9 0-5.4s3.9-1.5 5.4 0l3.1 3.1 3.1-3.1c1.5-1.5 3.9-1.5 5.4 0s1.5 3.9 0 5.4l-8.5 8.5z" />
          </svg>
        </Button>

        {/* Discount Badge */}
        {isDiscounted && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            Акция
          </div>
        )}

        {/* Stock Indicator */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          Остаток: {product.stock}
        </div>

        {/* Multiple Images Indicator */}
        {productImages.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            {productImages.length} фото
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          <span className="text-xs text-gray-500">{product.category}</span>
        </div>

        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 h-12">
          <Link to={`/product/${product.id}`} className="hover:text-blue-600">
            {product.name}
          </Link>
        </h3>

        <div className="flex items-center mb-3">
          {/* Rating */}
          <div className="flex items-center mr-3">
            <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
            <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          {isDiscounted ? (
            <div className="flex items-center">
              <span className="text-lg font-bold text-gray-800">{product.discountPrice.toLocaleString()} ₽</span>
              <span className="ml-2 text-sm text-gray-500 line-through">{product.price.toLocaleString()} ₽</span>
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-800">{product.price.toLocaleString()} ₽</span>
          )}
        </div>

        {/* Add to Cart Button */}
        <Button
          variant="primary"
          onClick={handleAddToCart}
          className="w-full py-2 px-4 rounded-md transition-colors duration-200"
        >
          В корзину
        </Button>
      </div>
    </div>
  );

};

export default ProductCard;