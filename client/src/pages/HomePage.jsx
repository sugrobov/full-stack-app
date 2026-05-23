import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/UI/Button';

// Статические данные (можно будет заменить на API)
const newsItems = [
  { id: 1, date: '2025-05-10', title: 'Новая коллекция летней одежды', preview: 'Лёгкие ткани, яркие цвета — встречайте лето стильно!' },
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
    <div className="bg-white">
      {/* Hero — минималистичный */}
      <section className="py-24 px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight"
        >
          Всё, что вам нужно, уже здесь
        </motion.h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto mb-10">
          Откройте для себя лучшие товары по честным ценам. Присоединяйтесь к тысячам довольных покупателей.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/shop">
            <Button variant="primary" size="lg">Перейти в магазин</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">Войти / Регистрация</Button>
          </Link>
        </div>
      </section>

      {/* Преимущества — иконки, без карточек */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {advantages.map((adv, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl mb-2">{adv.icon}</div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">{adv.title}</h3>
              <p className="text-xs text-gray-500">{adv.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Акции — горизонтальные баннеры с мягким градиентом */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Акции и предложения</h2>
        <div className="space-y-4">
          {promotions.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              </div>
              <div className="flex items-center gap-3 mt-3 sm:mt-0">
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {item.discount}
                </span>
                <Link to={item.link}>
                  <Button variant="primary" size="sm">Подробнее</Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Новости — список с датой и заголовком */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Новости</h2>
        <div className="space-y-6">
          {newsItems.map((news) => (
            <motion.div
              key={news.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 pb-4 border-b border-gray-100 last:border-none"
            >
              <time className="text-sm text-gray-400 whitespace-nowrap">{new Date(news.date).toLocaleDateString('ru-RU')}</time>
              <div>
                <h3 className="text-base font-medium text-gray-900">{news.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{news.preview}</p>
              </div>
              <Link to="/news" className="text-sm text-blue-600 hover:text-blue-800 self-start sm:self-center ml-auto">
                Читать →
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Подписка */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Будьте в курсе новостей</h2>
          <p className="text-sm text-gray-500 mb-6">Подпишитесь на рассылку и получайте первыми информацию о скидках и новинках</p>
          <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => { e.preventDefault(); alert('Функция подписки в разработке'); }}>
            <input
              type="email"
              placeholder="Ваш email"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
            <Button type="submit" variant="primary">Подписаться</Button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;