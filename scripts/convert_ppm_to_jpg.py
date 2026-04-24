import os
from PIL import Image

def convert_ppm_to_jpg(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith('.ppm'):
                ppm_path = os.path.join(root, file)
                jpg_path = os.path.splitext(ppm_path)[0] + '.jpg'
                try:
                    with Image.open(ppm_path) as img:
                        rgb_img = img.convert('RGB')
                        rgb_img.save(jpg_path, 'JPEG', quality=85)
                    print(f'Конвертирован: {ppm_path} -> {jpg_path}')
                    # Удаляем .ppm после успешной конвертации (опционально)
                    # os.remove(ppm_path)
                except Exception as e:
                    print(f'Ошибка при конвертации {ppm_path}: {e}')

if __name__ == '__main__':
    images_dir = os.path.join('client', 'public', 'images')
    if not os.path.exists(images_dir):
        print(f'Директория {images_dir} не найдена. Создайте её и скопируйте в нее папки category* с файлами .ppm')
    else:
        convert_ppm_to_jpg(images_dir)
        print('Конвертация завершена.')