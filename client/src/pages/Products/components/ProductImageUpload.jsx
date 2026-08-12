import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const ProductImageUpload = ({ productId, images = [], onImagesChanged }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // useEffect(() => {
  //   setPreview(existingImageUrl || null);
  // }, [existingImageUrl]);

  // Удаление изображения
  const handleDelete = async (urlToDelete) => {
    if (!urlToDelete) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/products/${productId}/images`, {
        data: { imageUrl: urlToDelete },
        headers: { Authorization: `Bearer ${token}` }
      });
      // после удаления обновляем список изображений
      const updated = images.filter(url => url !== urlToDelete);
      onImagesChanged(updated);
    } catch {
      setError('Ошибка удаления изображения');
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Клиентская валидация (для UX)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Поддерживаются только JPEG, PNG, WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5 МБ');
      return;
    }

    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('image', file);


    const token = localStorage.getItem('token');

    try {
      const response = await axios.post(
        `${API_URL}/admin/products/${productId}/upload`,
        formData,
        {
          headers: {
            // 'Content-Type': 'multipart/form-data',
            // ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      const newUrl = response.data.imageUrl;
      // добавляем новый url в список изображений
      onImagesChanged([...images, newUrl]);

    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  }, [productId, images, onImagesChanged]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="product-image-upload">
      {/* галерея изображений */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
        {images.map(url => (
          <div key={url} style={{ position: 'relative', width: '80px', height: '80px' }}>
            <img
              src={url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
            />
            <button
              type="button"
              onClick={() => handleDelete(url)}
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                background: 'red',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                lineHeight: '1',
              }}
              title="Удалить изображение"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div
        {...getRootProps()}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          backgroundColor: isDragActive ? '#f0f0f0' : 'white',
        }}
      >
        <input {...getInputProps()} />
        <p>{isDragActive ? 'Отпустите файл' : 'Перетащите изображение или кликните для добавления'}</p>
      </div>
      {uploading && <p>Загрузка...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ProductImageUpload;