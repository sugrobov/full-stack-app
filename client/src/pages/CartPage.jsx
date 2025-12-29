import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, clearCart, increaseQuantity } from '../store/cartSlice';
import { Link } from 'react-router-dom';
import Button from '../components/UI/Button';
import Breadcrumb from '../components/Breadcrumb';

const CartPage = () => {
  const dispatch = useDispatch();
  const { items, totalAmount, totalQuantity } = useSelector(state => state.cart);
  
  const handleRemoveItem = (id) => {
    dispatch(removeFromCart(id));
  };
  
  const handleClearCart = () => {
    dispatch(clearCart());
  };
  
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ваша корзина пуста</h2>
          <p className="text-gray-600 mb-6">Добавьте товары в корзину, чтобы оформить заказ.</p>
          <Link
            to="/"
          >
            <Button variant="primary">
              Перейти к покупкам
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Breadcrumb />
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
      
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Корзина</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex justify-between items-center p-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Товары ({totalQuantity})
                </h2>
                <Button
                  variant="ghost"
                  onClick={handleClearCart}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Очистить корзину
                </Button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {items.map(item => (
                <div key={item.id} className="p-4 flex">
                  <div className="flex-shrink-0 w-24 h-24">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  
                  <div className="ml-4 flex-grow">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">{item.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {item.discountPrice ? (
                            <span>
                              <span className="font-medium">{item.discountPrice.toLocaleString()} ₽</span>
                              <span className="line-through text-gray-500 ml-2">{item.price.toLocaleString()} ₽</span>
                            </span>
                          ) : (
                            <span className="font-medium">{item.price.toLocaleString()} ₽</span>
                          )}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                    
                    <div className="mt-3 flex items-center">
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <Button
                          variant="ghost"
                          onClick={() => handleRemoveItem(item.id)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                        >
                          -
                        </Button>
                        <span className="px-3 py-1 text-gray-800">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          onClick={() => dispatch(increaseQuantity(item.id))}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </Button>
                      </div>
                      
                      <div className="ml-4 font-medium text-gray-800">
                        {item.totalPrice.toLocaleString()} ₽
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Итого</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Товары ({totalQuantity})</span>
                <span className="text-gray-800">{totalAmount.toLocaleString()} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Доставка</span>
                <span className="text-gray-800">Бесплатно</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Итого к оплате</span>
                  <span>{totalAmount.toLocaleString()} ₽</span>
                </div>
              </div>
            </div>
            
            <Button variant="primary" className="w-full py-3 font-medium">
              Оформить заказ
            </Button>
            
            <Link 
              to="/" 
              className="block text-center mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Продолжить покупки
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;