# Скрипт для создания архивов изображений по категориям
# Создание архивов для категорий 6-25

# Путь к папке с изображениями
$imagesPath = "client/public/images"

# Путь к папке для архивов
$archivesPath = "archives"

# Создание папки для архивов, если она не существует
if (!(Test-Path $archivesPath)) {
    New-Item -ItemType Directory -Path $archivesPath
}

# Создание архивов для категорий 6-25
for ($i = 6; $i -le 25; $i++) {
    $category = "category$i"
    $categoryPath = "$imagesPath/$category"
    
    # Проверка существования папки категории
    if (Test-Path $categoryPath) {
        Write-Host "Создание архива для $category..."
        
        # Создание архива
        Compress-Archive -Path $categoryPath -DestinationPath "$archivesPath/$category.zip" -Force
        
        Write-Host "Архив для $category создан"
    } else {
        Write-Host "Папка $category не найдена"
    }
}

Write-Host "Создание архивов завершено"