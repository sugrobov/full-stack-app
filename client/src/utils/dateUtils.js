export const formatRelativeDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Сегодня';
  } else if (diffDays === 1) {
    return 'Вчера';
  } else if (diffDays < 7) {
    return `${diffDays} дня назад`;
  } else {
    // Если прошло больше недели, показываем дату в формате ДД.ММ.ГГГГ
    return date.toLocaleDateString('ru-RU');
  }
};