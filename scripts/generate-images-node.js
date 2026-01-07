const fs = require('fs');
const path = require('path');

// Функция для генерации простого изображения в формате PPM (P3)
function generatePPMImage(width, height, color) {
  let ppm = `P3\n${width} ${height}\n255\n`;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Создаем градиент
      const r = Math.floor(color[0] * (1 - y / height) + 255 * (y / height));
      const g = Math.floor(color[1] * (1 - x / width) + 255 * (x / width));
      const b = Math.floor(color[2] * (1 - (x + y) / (width + height)) + 255 * ((x + y) / (width + height)));
      
      ppm += `${r} ${g} ${b} `;
      
      // Добавляем перевод строки каждые 5 пикселей для лучшей читаемости
      if (x % 5 === 4) {
        ppm += '\n';
      }
    }
    ppm += '\n';
  }
  
  return ppm;
}

// Функция для генерации случайного цвета
function getRandomColor() {
  return [
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256)
  ];
}

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
      const imagePath = path.join(categoryDir, `product${productId}_image${imgIndex}.ppm`);
      
      // Генерируем случайный цвет для изображения
      const color = getRandomColor();
      
      // Создаем изображение
      const imageContent = generatePPMImage(600, 400, color);
      fs.writeFileSync(imagePath, imageContent);
    }
  }
}

console.log('Image generation completed!');
console.log('Images are located in client/public/images/');
console.log('Each category has its own subdirectory with product images.');
console.log('Images are in PPM format (P3) which is supported by most browsers.');