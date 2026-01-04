import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { toggleFavorite } from '../store/favoritesSlice';
import Button from '../components/UI/Button';
import Breadcrumb from '../components/Breadcrumb';

const ProductPage = () => {
  const { id } = useParams();
  // const location = useLocation();
  const dispatch = useDispatch();
  const product = useSelector(state =>
    state.products.items.find(item => item.id === parseInt(id))
  );
  const favorites = useSelector(state => state.favorites.items);

  const isFavorite = favorites.includes(parseInt(id));
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Товар не найден</h2>
          <p className="text-gray-600">Извините, запрашиваемый товар не существует.</p>
        </div>
      </div>
    );
  }

  const productImages = product.images || [product.image]; const isGradient = typeof productImages[0] === 'string' && productImages[0].startsWith('linear-gradient');
  // const displayPrice = product.discountPrice || product.price;
  const isDiscounted = !!product.discountPrice;

  const handleAddToCart = () => {
    dispatch(addToCart(product));
  };

  const handleToggleFavorite = () => {
    dispatch(toggleFavorite(parseInt(id)));
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? productImages.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === productImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Breadcrumb productName={product ? product.name : 'Товар не найден'} />
        <Link
          to="/"
          className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="mr-2 -ml-1 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Product Images Slider */}
          <div>
            <div className="relative">
              {/* Main Image */}
              <div className="flex items-center justify-center mb-4">
                <div
                  className="w-full h-96 rounded-lg shadow-md flex items-center justify-center"
                  style={isGradient ? { background: productImages[currentImageIndex] } : {}}
                >
                  {!isGradient ? (
                    <img
                      src={productImages[currentImageIndex]}
                      alt={`${product.name} - изображение ${currentImageIndex + 1}`}
                      className="max-w-full h-auto rounded-lg"
                    />
                  ) : (
                    <div className="text-white font-bold text-2xl">
                      Товар #{product.id}
                      <div className="text-lg mt-2">Изображение {currentImageIndex + 1}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 p-2 rounded-full shadow-md"
                  >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 p-2 rounded-full shadow-md"
                  >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full">
                    {currentImageIndex + 1} / {productImages.length}
                  </div>
                </>
              )}

              {/* Thumbnails */}
              {productImages.length > 1 && (
                <div className="flex justify-center space-x-2 mt-4">
                  {productImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-16 h-16 rounded-md overflow-hidden border-2 ${currentImageIndex === index ? 'border-blue-500' : 'border-transparent'
                        }`}
                      style={isGradient ? { background: img } : {}}
                    >
                      {!isGradient ? (
                        <img
                          src={img}
                          alt={`Миниатюра ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-white font-bold">
                          {index + 1}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div>
            <div className="mb-4">
              <span className="text-sm text-gray-500">{product.category}</span>
              <h1 className="text-3xl font-bold text-gray-800 mt-2">{product.name}</h1>
            </div>

            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-gray-600">{product.rating}</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              {isDiscounted ? (
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-gray-800">{product.discountPrice.toLocaleString()} ₽</span>
                  <span className="ml-4 text-xl text-gray-500 line-through">{product.price.toLocaleString()} ₽</span>
                  <span className="ml-4 bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    Экономия {product.price - product.discountPrice} ₽
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-gray-800">{product.price.toLocaleString()} ₽</span>
              )}
            </div>

            {/* Stock */}
            <div className="mb-6">
              <div className="flex items-center">
                <span className="text-gray-600 mr-2">В наличии:</span>
                <span className={`font-medium ${product.stock > 5 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {product.stock > 0 ? `${product.stock} шт.` : 'Нет в наличии'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Описание</h2>
              <p className="text-gray-600">{product.description}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <Button
                variant={product.stock === 0 ? "secondary" : "primary"}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="px-6 py-3 rounded-md font-medium"
              >
                {product.stock === 0 ? 'Нет в наличии' : 'Добавить в корзину'}
              </Button>

              <Button
                variant={isFavorite ? "danger" : "secondary"}
                onClick={handleToggleFavorite}
                className="px-6 py-3 rounded-md font-medium flex items-center"
              >
                <svg
                  className={`w-5 h-5 mr-2 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M10 18.5l-8.5-8.5c-1.5-1.5-1.5-3.9 0-5.4s3.9-1.5 5.4 0l3.1 3.1 3.1-3.1c1.5-1.5 3.9-1.5 5.4 0s1.5 3.9 0 5.4l-8.5 8.5z" />
                </svg>
                {isFavorite ? 'В избранном' : 'В избранное'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default ProductPage;