import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const ProductImageUpload = ({ productId, onImageUploaded, existingImageUrl }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(existingImageUrl || null);
  const [error, setError] = useState('');

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

    // CSRF защита: если используете cookies
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    try {
      const response = await axios.post(
        `/api/admin/products/${productId}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
          },
        }
      );
      const { imageUrl } = response.data;
      setPreview(imageUrl);
      if (onImageUploaded) onImageUploaded(imageUrl);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  }, [productId, onImageUploaded]);

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
        {preview ? (
          <div>
            <img src={preview} alt="Product" style={{ maxWidth: '200px', maxHeight: '200px', marginBottom: '10px' }} />
            <p>Перетащите новое изображение или нажмите для замены</p>
          </div>
        ) : (
          <p>{isDragActive ? 'Отпустите файл' : 'Перетащите изображение или кликните для выбора'}</p>
        )}
      </div>
      {uploading && <p>Загрузка...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ProductImageUpload;