import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Breadcrumb from '../components/Breadcrumb';
import Button from '../components/UI/Button';

// Статические данные новостей (можно будет заменить на API)
const newsItems = [
  {
    id: 1,
    date: '2025-05-10',
    title: 'Новая коллекция летней одежды',
    preview: 'Лёгкие ткани, яркие цвета — встречайте лето стильно!',
    content: 'Мы рады представить новую коллекцию летней одежды. В этом сезоне мы сделали акцент на натуральные ткани, яркие цвета и удобные фасоны. В коллекции вы найдёте лёгкие платья, шорты, футболки и аксессуары из натурального хлопка и льна. Все модели идеально подходят для жаркой погоды и подчеркнут ваш индивидуальный стиль. Спешите обновить свой гардероб к летнему сезону!',
    image: null,
    category: 'Новинки',
  },
  {
    id: 2,
    date: '2025-05-05',
    title: 'Скидка 20% на электронику',
    preview: 'Только до конца недели. Успейте купить смартфоны и ноутбуки со скидкой.',
    content: 'Только до конца этой недели мы дарим скидку 20% на весь ассортимент электроники! В акции участвуют смартфоны, ноутбуки, планшеты, наушники и аксессуары. Это отличная возможность обновить свою технику по выгодной цене. Количество товаров по акции ограничено. Успейте сделать заказ!',
    image: null,
    category: 'Акции',
  },
  {
    id: 3,
    date: '2025-04-28',
    title: 'Бесплатная доставка от 3000₽',
    preview: 'При заказе от 3000 рублей доставка по городу бесплатно.',
    content: 'Теперь при заказе на сумму от 3000 рублей доставка по городу осуществляется бесплатно! Мы хотим, чтобы ваши покупки были максимально выгодными и приятными. Бесплатная доставка действует для всех товаров в нашем каталоге. Спешите порадовать себя и своих близких отличными покупками!',
    image: null,
    category: 'Новости магазина',
  },
  {
    id: 4,
    date: '2025-04-20',
    title: 'Новые поступления: весенняя коллекция обуви',
    preview: 'Кроссовки, туфли, ботинки — большой выбор на любой вкус.',
    content: 'Весна — время обновлений! В наш магазин поступила новая коллекция обуви. Кроссовки для активного отдыха, элегантные туфли для офиса, удобные ботинки для прогулок — у нас есть всё. Все модели выполнены из качественных материалов и отличаются повышенной износостойкостью. Приходите и выбирайте!',
    image: null,
    category: 'Новинки',
  },
  {
    id: 5,
    date: '2025-04-15',
    title: 'Партнёрство с ведущими брендами',
    preview: 'Теперь в нашем ассортименте товары от мировых производителей.',
    content: 'Мы рады сообщить о начале сотрудничества с ведущими мировыми брендами. Теперь в нашем магазине представлены товары от лучших производителей электроники, одежды и аксессуаров. Мы тщательно отбираем каждого партнёра, чтобы гарантировать высокое качество продукции. Следите за обновлениями — впереди много интересного!',
    image: null,
    category: 'Новости магазина',
  },
  {
    id: 6,
    date: '2025-04-10',
    title: 'График работы в праздничные дни',
    preview: 'Уточните часы работы магазина в предстоящие праздники.',
    content: 'Уважаемые покупатели! Обратите внимание на изменения в графике работы магазина в праздничные дни. 1 мая — выходной день. 9 мая — сокращённый рабочий день до 16:00. В остальные дни магазин работает в обычном режиме. Доставка заказов осуществляется по стандартному графику. С наступающими праздниками!',
    image: null,
    category: 'Информация',
  },
];

const NewsDetailPage = () => {
  const { id } = useParams();
  const news = newsItems.find(item => item.id === parseInt(id));

  if (!news) {
    return (
      <main className="container mx-auto px-4 py-8" aria-labelledby="news-not-found-heading">
        <Breadcrumb />
        <div className="text-center py-12" role="alert">
          <h2 id="news-not-found-heading" className="text-2xl font-bold text-gray-800 mb-4">Новость не найдена</h2>
          <p className="text-gray-600 mb-6">Извините, запрашиваемая новость не существует.</p>
          <Link to="/news">
            <Button variant="primary">Все новости</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8" aria-labelledby="news-title">
      <div className="flex items-center justify-between mb-6">
        <Breadcrumb />
        <Link
          to="/news"
          className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          aria-label="Вернуться к списку новостей"
        >
          <svg className="mr-2 -ml-1 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          К новостям
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md overflow-hidden max-w-3xl mx-auto"
      >
        {/* Заглушка изображения */}
        <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" aria-hidden="true">
          <svg className="w-24 h-24 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">
              {news.category}
            </span>
            <time className="text-sm text-gray-400" dateTime={news.date}>
              {new Date(news.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </div>

          <h1 id="news-title" className="text-3xl font-bold text-gray-800 mb-6">{news.title}</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-600 leading-relaxed mb-4">{news.preview}</p>
            <p className="text-gray-700 leading-relaxed">{news.content}</p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link to="/news">
              <Button variant="secondary">
                ← Все новости
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
};

export default NewsDetailPage;