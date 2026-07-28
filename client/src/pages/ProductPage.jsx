import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { toggleFavorite } from '../store/favoritesSlice';
import { fetchProductById } from '../store/productsSlice';
import Button from '../components/UI/Button';
import Breadcrumb from '../components/Breadcrumb';
import ProductPageSkeleton from '../components/ProductPageSkeleton';
import Reviews from '../components/Reviews';
import toast from 'react-hot-toast';

const ProductPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const productFromList = useSelector(state =>
    state.products.items.find(item => item.id === parseInt(id))
  );
  const currentProduct = useSelector(state => state.products.currentProduct);
  const status = useSelector(state => state.products.status);
  const favorites = useSelector(state => state.favorites.items);

  const product = productFromList || currentProduct;
  const isFavorite = favorites.includes(parseInt(id));
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState({});

  const handleImageError = (imageUrl) => {
    setFailedImages(prev => ({ ...prev, [imageUrl]: true }));
  };

  useEffect(() => {
    if (!productFromList && !currentProduct && status !== 'loading') {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id, productFromList, currentProduct, status]);

  if (status === 'loading' && !product) {
    return <ProductPageSkeleton />;
  }

  if (!product) {
    return (
      <main className="container mx-auto px-4 py-8" aria-labelledby="not-found-heading">
        <div className="text-center">
          <h2 id="not-found-heading" className="text-2xl font-bold text-gray-800 mb-4">Товар не найден</h2>
          <p className="text-gray-600">Извините, запрашиваемый товар не существует.</p>
        </div>
      </main>
    );
  }

  const productImages = product.images || (product.image ? [product.image] : []);
  const isDiscounted = !!product.discount_price;
  const currentImage = productImages[currentImageIndex];
  const hue = (product.id * 37 + currentImageIndex * 17) % 360;

  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      discountPrice: product.discount_price,
      price: product.price,
      images: productImages,
    };
    toast.success(`${product.name} добавлен в корзину`);
    dispatch(addToCart(cartItem));
  };

  const handleToggleFavorite = () => {
    toast.success(isFavorite ? 'Удалено из избранного' : 'Добавлено в избранное');
    dispatch(toggleFavorite(parseInt(id)));
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
  };

  const isValidLocalImage = (url) => {
    return url && typeof url === 'string' && (url.startsWith('/images/') || url.startsWith('/uploads/'));
  };

  return (
    <main className="container mx-auto px-4 py-8" aria-labelledby="product-heading">
      <div className="flex items-center justify-between mb-6">
        <Breadcrumb productName={product.name} />
        <Link
          to="/"
          className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          aria-label="Вернуться на главную"
        >
          <svg className="mr-2 -ml-1 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              <div className="flex items-center justify-center mb-4">
                {isValidLocalImage(currentImage) && !failedImages[currentImage] ? (
                  <img
                    src={currentImage}
                    alt={`${product.name} - изображение ${currentImageIndex + 1}`}
                    className="max-w-full h-auto rounded-lg object-contain max-h-96"
                    loading="lazy"
                    onError={() => handleImageError(currentImage)}
                  />
                ) : (
                  <svg width="400" height="400" viewBox="0 0 400 400" className="max-w-full h-auto rounded-lg max-h-96" role="img" aria-label={product.name}>
                    <rect width="400" height="400" fill={`hsl(${hue}, 70%, 80%)`} />
                    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#333" fontSize="24">
                      {product.name}
                    </text>
                  </svg>
                )}
              </div>

              {productImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 p-2 rounded-full shadow-md"
                    aria-label="Предыдущее изображение"
                  >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 p-2 rounded-full shadow-md"
                    aria-label="Следующее изображение"
                  >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/70 backdrop-blur-sm text-gray-800 text-sm px-3 py-1 rounded-full font-medium shadow-md"
                    role="status"
                    aria-live="polite"
                  >
                    {currentImageIndex + 1} / {productImages.length}
                  </div>
                </>
              )}

              {/* Миниатюры */}
              <div className="flex justify-center space-x-2 mt-4">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-16 h-16 rounded-md overflow-hidden border-2 ${currentImageIndex === index ? 'border-blue-500' : 'border-transparent'}`}
                    aria-label={`Миниатюра ${index + 1}`}
                    aria-current={currentImageIndex === index ? 'true' : undefined}
                  >
                    {isValidLocalImage(img) && !failedImages[img] ? (
                      <img
                        src={img}
                        alt={`Миниатюра ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={() => handleImageError(img)}
                      />
                    ) : (
                      <svg width="64" height="64" viewBox="0 0 64 64" className="w-full h-full" role="img" aria-label={`Миниатюра ${index + 1}`}>
                        <rect width="64" height="64" fill={`hsl(${(product.id * 37 + index * 17) % 360}, 70%, 80%)`} />
                        <text x="32" y="32" dominantBaseline="middle" textAnchor="middle" fill="#333" fontSize="10">
                          {index + 1}
                        </text>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div>
            <div className="mb-4">
              <span className="text-sm text-gray-500">{product.category_name || product.category}</span>
              <h1 id="product-heading" className="text-3xl font-bold text-gray-800 mt-2">{product.name}</h1>
            </div>

            <div className="flex items-center mb-4">
              <div className="flex" aria-label={`Рейтинг ${product.rating} из 5`}>
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`}
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-gray-600">{product.rating}</span>
            </div>

            <div className="mb-6">
              {isDiscounted ? (
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-gray-800">{product.discount_price.toLocaleString()} ₽</span>
                  <span className="ml-4 text-xl text-gray-500 line-through">{product.price.toLocaleString()} ₽</span>
                  <span className="ml-4 bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    Экономия {product.price - product.discount_price} ₽
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-gray-800">{product.price.toLocaleString()} ₽</span>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-center">
                <span className="text-gray-600 mr-2">В наличии:</span>
                <span className={`font-medium ${product.stock > 5 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {product.stock > 0 ? `${product.stock} шт.` : 'Нет в наличии'}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Описание</h2>
              <p className="text-gray-600">{product.description}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                variant={product.stock === 0 ? "secondary" : "primary"}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="px-6 py-3 rounded-md font-medium"
                aria-label={product.stock === 0 ? 'Товар отсутствует' : 'Добавить в корзину'}
              >
                {product.stock === 0 ? 'Нет в наличии' : 'Добавить в корзину'}
              </Button>

              <Button
                variant={isFavorite ? "danger" : "secondary"}
                onClick={handleToggleFavorite}
                className="px-6 py-3 rounded-md font-medium flex items-center"
                aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
              >
                <svg
                  className={`w-5 h-5 mr-2 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M10 18.5l-8.5-8.5c-1.5-1.5-1.5-3.9 0-5.4s3.9-1.5 5.4 0l3.1 3.1 3.1-3.1c1.5-1.5 3.9-1.5 5.4 0s1.5 3.9 0 5.4l-8.5 8.5z" />
                </svg>
                {isFavorite ? 'В избранном' : 'В избранное'}
              </Button>
            </div>
            <Reviews productId={product.id} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductPage;