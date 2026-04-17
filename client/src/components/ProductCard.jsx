import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import Button from './UI/Button';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const images = product.images || (product.image ? [product.image] : []);
  const firstImage = images.length > 0 ? images[0] : null;
  const isDiscounted = !!product.discount_price;

  // функция проверки валидного локального изображения
  const isValidLocalImage = (url) => {
    return url && typeof url === 'string' && url.startsWith('/images/');
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      discountPrice: product.discount_price,
      image: isValidLocalImage(firstImage) ? firstImage : null,
      images: images,
      quantity: 1,
      totalPrice: product.discount_price || product.price,
    };
    dispatch(addToCart(cartItem));
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <Link to={`/product/${product.id}`} className="flex-grow flex flex-col">
        {/* блок изображения с SVG-заглушкой */}
        <div className="relative h-56 overflow-hidden bg-gray-100 flex items-center justify-center">
          {(() => {
            if (isValidLocalImage(firstImage)) {
              return <img src={firstImage} alt={product.name} className="w-full h-full object-cover" />;
            } else {
              const hue = (product.id * 37) % 360;
              return (
                <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="none">
                  <rect width="400" height="400" fill={`hsl(${hue}, 70%, 80%)`} />
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#333" fontSize="20" fontFamily="Arial, sans-serif">
                    {product.name}
                  </text>
                </svg>
              );
            }
          })()}
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