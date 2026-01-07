import os
import random
from PIL import Image, ImageDraw, ImageFont

# Создаем директорию для изображений, если её нет
images_dir = os.path.join(os.path.dirname(__file__), '..', 'client', 'public', 'images')
os.makedirs(images_dir, exist_ok=True)

# Генерируем изображения для 25 категорий
for category_index in range(1, 26):
    category_dir = os.path.join(images_dir, f'category{category_index}')
    os.makedirs(category_dir, exist_ok=True)
    
    # Генерируем изображения для 40 товаров в каждой категории
    for product_index in range(1, 41):
        product_id = category_index * 100 + product_index
        
        # Генерируем от 1 до 5 изображений для каждого товара
        image_count = random.randint(1, 5)
        
        for img_index in range(1, image_count + 1):
            image_path = os.path.join(category_dir, f'product{product_id}_image{img_index}.jpg')
            
            # Создаем изображение
            width, height = 600, 400
            image = Image.new('RGB', (width, height), color=get_random_color())
            draw = ImageDraw.Draw(image)
            
            # Добавляем текст на изображение
            text = f"Product {product_id}\nCategory {category_index}\nImage {img_index}"
            # Пытаемся использовать шрифт, если он доступен
            try:
                font = ImageFont.truetype("arial.ttf", 24)
            except:
                font = ImageFont.load_default()
            
            # Вычисляем размер текста и позицию для центрирования
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            x = (width - text_width) // 2
            y = (height - text_height) // 2
            
            # Рисуем текст
            draw.text((x, y), text, fill=(255, 255, 255), font=font)
            
            # Сохраняем изображение
            image.save(image_path, 'JPEG')

def get_random_color():
    """Генерирует случайный цвет"""
    return (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))

print("Image generation completed!")
print("Images are located in client/public/images/")
print("Each category has its own subdirectory with product images.")