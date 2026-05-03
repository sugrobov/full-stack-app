import React from 'react';
import Button from './Button';

// Подтверждение выхода из аккаунта
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button variant="danger" onClick={onConfirm}>Удалить</Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;