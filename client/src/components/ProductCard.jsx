import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { toggleFavorite } from '../store/favoritesSlice';
import Button from './UI/Button';
import toast from 'react-hot-toast';

const ProductCard = React.memo(({ product }) => {
  const dispatch = useDispatch();
  const favoriteIds = useSelector(state => state.favorites.items);
  const isFavorite = favoriteIds.includes(product.id);

  const imageUrl = product.images?.[0] || product.image || null;
  const isDiscounted = !!product.discount_price;
  const [imgError, setImgError] = useState(false);

  const isValidImage = imageUrl && (imageUrl.startsWith('/images/') || imageUrl.startsWith('/uploads/'));

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleFavorite(product.id));
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      discountPrice: product.discount_price,
      image: isValidImage && !imgError ? imageUrl : null,
      images: product.images || [],
      quantity: 1,
      totalPrice: product.discount_price || product.price,
    };
    dispatch(addToCart(cartItem));
    toast.success(`${product.name} добавлен в корзину`);
  };

  return (
    <div className="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full relative">
      {/* Кнопка избранного */}
      <Button
        variant="icon"
        onClick={handleToggleFavorite}
        className={`absolute top-2 right-2 z-10 p-1 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors ${
          isFavorite ? 'text-red-500' : 'text-gray-400'
        }`}
        aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
      >
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill={isFavorite ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </Button>

      <Link to={`/product/${product.id}`} className="flex-grow flex flex-col">
        <div className="relative h-56 overflow-hidden bg-gray-100 flex items-center justify-center">
          {isValidImage && !imgError ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="none">
              <rect width="400" height="400" fill={`hsl(${(product.id * 37) % 360}, 70%, 80%)`} />
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#333" fontSize="20" fontFamily="Arial, sans-serif">
                {product.name}
              </text>
            </svg>
          )}
        </div>

        <div className="p-4 flex-grow flex flex-col">
          <div className="mb-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {product.category_name || product.category}
            </span>
          </div>
          <h3 className="font-medium text-gray-800 text-sm mb-2 line-clamp-2 h-10">
            {product.name}
          </h3>
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
          <div className="mt-auto">
            {isDiscounted ? (
              <div className="space-y-1">
                <div className="text-lg font-bold text-gray-800">
                  {product.discount_price.toLocaleString()} ₽
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 line-through">
                    {product.price.toLocaleString()} ₽
                  </span>
                  <span className="ml-2 text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                    Экономия {(product.price - product.discount_price).toLocaleString()} ₽
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
      <div className="p-4 pt-0">
        <Button
          variant={product.stock === 0 ? "secondary" : "primary"}
          data-testid="add-to-cart-button"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="w-full py-2 text-sm"
        >
          {product.stock === 0 ? 'Нет в наличии' : 'В корзину'}
        </Button>
      </div>
    </div>
  );
});

export default ProductCard;