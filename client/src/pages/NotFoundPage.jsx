import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/UI/Button';

const NotFoundPage = () => {
  return (
    <main className="container mx-auto px-4 py-8" aria-labelledby="not-found-heading">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto text-center py-16"
      >
        <div className="text-8xl font-bold text-blue-200 mb-4" aria-hidden="true">404</div>

        <div className="w-24 h-24 mx-auto mb-6 text-gray-300" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 id="not-found-heading" className="text-3xl font-bold text-gray-800 mb-4">
          Страница не найдена
        </h1>

        <p className="text-gray-600 mb-8 leading-relaxed">
          Извините, запрашиваемая страница не существует или была перемещена.<br />
          Проверьте правильность введённого адреса или вернитесь на главную.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="primary" size="lg">
              На главную
            </Button>
          </Link>
          <Link to="/shop">
            <Button variant="secondary" size="lg">
              В каталог
            </Button>
          </Link>
        </div>
      </motion.div>
    </main>
  );
};

export default NotFoundPage;