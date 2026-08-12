import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

const ITEMS_PER_PAGE = 4;

const NewsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [...new Set(newsItems.map(item => item.category))];

  const filteredNews = selectedCategory
    ? newsItems.filter(item => item.category === selectedCategory)
    : newsItems;

  const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <main className="container mx-auto px-4 py-8" aria-labelledby="news-page-heading">
      <div className="mb-6">
        <Breadcrumb />
      </div>

      <h1 id="news-page-heading" className="text-3xl font-bold text-gray-800 mb-8">Новости</h1>

      {/* Фильтр по категориям */}
      <ul className="flex flex-wrap gap-2 mb-8" data-testid="category-filters" role="list">
        <li role="listitem">
          <button
            onClick={() => handleCategoryChange('')}
            data-testid="category-All"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={selectedCategory === ''}
          >
            Все
          </button>
        </li>
        {categories.map(cat => (
          <li key={cat} role="listitem">
            <button
              onClick={() => handleCategoryChange(cat)}
              data-testid={`category-${cat}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-pressed={selectedCategory === cat}
            >
              {cat}
            </button>
          </li>
        ))}
      </ul>

      {/* Список новостей */}
      {paginatedNews.length === 0 ? (
        <div data-testid="empty-news" className="text-center py-12 bg-white rounded-lg shadow" role="status">
          <p className="text-gray-600">Новости не найдены</p>
        </div>
      ) : (
        <div className="space-y-6" role="list" aria-label="Список новостей">
          {paginatedNews.map((news, idx) => (
            <motion.div
              key={news.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              data-testid={`news-card-${news.id}`}
              role="listitem"
            >
              <Link to={`/news/${news.id}`} className="block p-6" aria-label={`Читать новость: ${news.title}`}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-full sm:w-48 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                    <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">
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
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors" data-testid={`news-title-${news.id}`}>
                      {news.title}
                    </h2>
                    <p className="text-gray-600 line-clamp-2" data-testid={`news-preview-${news.id}`}>{news.preview}</p>
                    <div className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors">
                      Читать далее →
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <nav className="flex justify-center items-center space-x-2 mt-8" data-testid="pagination" aria-label="Пагинация новостей">
          <Button
            variant="secondary"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            data-testid="prev-button"
            aria-label="Предыдущая страница"
          >
            ← Назад
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              variant={page === currentPage ? 'primary' : 'secondary'}
              onClick={() => setCurrentPage(page)}
              data-testid={`page-${page}`}
              aria-label={`Страница ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="secondary"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            data-testid="next-button"
            aria-label="Следующая страница"
          >
            Вперед →
          </Button>
        </nav>
      )}
    </main>
  );
};

export default NewsPage;