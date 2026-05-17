import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/UI/Button';

// Статичные данные (позже можно вынести в отдельный файл или подгружать с API)
const newsItems = [
  { id: 1, date: '2025-05-10', title: 'Новая коллекция летней одежды', preview: 'Легкие ткани, яркие цвета – встречайте лето стильно!' },
  { id: 2, date: '2025-05-05', title: 'Скидка 20% на электронику', preview: 'Только до конца недели. Успейте купить смартфоны и ноутбуки со скидкой.' },
  { id: 3, date: '2025-04-28', title: 'Бесплатная доставка от 3000₽', preview: 'При заказе от 3000 рублей доставка по городу бесплатно.' },
];

const promotions = [
  { id: 1, title: '🔥 Весенняя распродажа', description: 'Скидки до 50% на все товары из коллекции "Весна-Лето"', discount: 'до 50%', link: '/shop' },
  { id: 2, title: '🎁 Подарок при заказе', description: 'При покупке от 5000₽ получите фирменный брелок в подарок', discount: 'подарок', link: '/shop' },
  { id: 3, title: '🚚 Бесплатная доставка', description: 'Для всех заказов на сумму свыше 3000₽', discount: 'бесплатно', link: '/shop' },
];

const advantages = [
  { icon: '🚀', title: 'Быстрая доставка', text: 'По всей стране за 1-3 дня' },
  { icon: '🔄', title: 'Лёгкий возврат', text: 'Верните товар в течение 30 дней' },
  { icon: '🔒', title: 'Безопасная оплата', text: 'SSL-шифрование и защита данных' },
  { icon: '👍', title: 'Оригинальные товары', text: 'Только проверенные бренды' },
];

const HomePage = () => {
  return (
    <div className="bg-gray-50">
      {/* Hero секция */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Добро пожаловать в наш магазин!</h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">Лучшие товары по лучшим ценам</p>
          <Link to="/shop">
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Перейти в магазин
            </Button>
          </Link>
        </div>
      </section>

      {/* О компании */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">О компании</h2>
          <p className="text-gray-600 leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </p>
        </div>
      </section>

      {/* Преимущества */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Почему выбирают нас</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {advantages.map((adv, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl mb-4">{adv.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{adv.title}</h3>
                <p className="text-gray-600">{adv.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Акции (компактно) */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Акции и предложения</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {promotions.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="p-6">
                <div className="text-2xl mb-2">{item.title}</div>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
                    {item.discount}
                  </span>
                  <Link to={item.link}>
                    <Button variant="primary" size="sm">Узнать</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Новости */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Новости</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {newsItems.map((news) => (
              <div key={news.id} className="border rounded-lg p-6 hover:shadow-md transition">
                <div className="text-sm text-gray-500 mb-2">{new Date(news.date).toLocaleDateString('ru-RU')}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{news.title}</h3>
                <p className="text-gray-600 mb-4">{news.preview}</p>
                <button className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                  Подробнее 
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Подписка */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Будьте в курсе новостей</h2>
          <p className="text-gray-600 mb-6">Подпишитесь на рассылку и получайте первыми информацию о скидках и новинках</p>
          <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4" onSubmit={(e) => { e.preventDefault(); alert('Функция подписки в разработке'); }}>
            <input type="email" placeholder="Ваш email" className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            <Button type="submit" variant="primary">Подписаться</Button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;