const fs = require('fs');
const path = require('path');

// Создаем директорию для изображений, если её нет
const imagesDir = path.join(__dirname, '..', 'client', 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Генерируем изображения для 25 категорий
for (let categoryIndex = 1; categoryIndex <= 25; categoryIndex++) {
  const categoryDir = path.join(imagesDir, `category${categoryIndex}`);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }

  // Генерируем изображения для 40 товаров в каждой категории
  for (let productIndex = 1; productIndex <= 40; productIndex++) {
    const productId = categoryIndex * 100 + productIndex;
    
    // Генерируем от 1 до 5 изображений для каждого товара
    const imageCount = Math.floor(Math.random() * 5) + 1;
    
    for (let imgIndex = 1; imgIndex <= imageCount; imgIndex++) {
      const imagePath = path.join(categoryDir, `product${productId}_image${imgIndex}.jpg`);
      
      // Создаем простое изображение в формате JPEG
      // В реальном приложении здесь будет код для генерации или загрузки реальных изображений
      const imageContent = generateSimpleImage(categoryIndex, productId, imgIndex);
      fs.writeFileSync(imagePath, imageContent);
    }
  }
}

function generateSimpleImage(categoryIndex, productId, imgIndex) {
  // Это упрощенная реализация генерации изображения
  // В реальном приложении здесь будет код для создания реальных изображений
  // Например, можно использовать библиотеки типа canvas, sharp или другие
  
  // Создаем простой текстовый файл вместо изображения для демонстрации
  return `Image for product ${productId}, category ${categoryIndex}, image ${imgIndex}`;
}

console.log('Image generation completed!');
console.log('Images are located in client/public/images/');
console.log('Each category has its own subdirectory with product images.');