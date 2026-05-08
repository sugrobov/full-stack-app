import React from 'react';
import { Link } from 'react-router-dom';

const BackToAdminButton = () => {
  return (
    <div className="mb-4">
      <Link
        to="/admin"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
      >
        ← Назад в админ-панель
      </Link>
    </div>
  );
};

export default BackToAdminButton;