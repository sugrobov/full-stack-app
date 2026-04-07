import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Link } from 'react-router-dom';
import Input from './UI/Input';

const ProductSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/products/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`
                );
                if (!response.ok) throw new Error('Ошибка поиска');
                const data = await response.json();
                setResults(data.products);
                setShowDropdown(true);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    const handleInputChange = (e) => {
        setQuery(e.target.value);
    };

    const handleSelectProduct = () => {
        setQuery('');
        setShowDropdown(false);
        setResults([]);
    };

    return (
        <div ref={wrapperRef} className="relative mb-6">
            <Input
                type="text"
                placeholder="Поиск товаров..."
                value={query}
                onChange={handleInputChange}
                onFocus={() => results.length > 0 && setShowDropdown(true)}
                className="w-full"
            />

            {showDropdown && (
                <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {loading && (
                        <div className="p-4 text-center text-gray-500">Загрузка...</div>
                    )}
                    {!loading && results.length === 0 && debouncedQuery && (
                        <div className="p-4 text-center text-gray-500">Ничего не найдено</div>
                    )}
                    {!loading && results.map((product, idx) => (
                        <Link
                            key={product.id}
                            to={`/product/${product.id}`}
                            onClick={handleSelectProduct}
                            className={`flex items-center p-4 hover:bg-gray-50 transition-colors ${idx !== results.length - 1 ? 'border-b border-gray-100' : ''
                                }`}
                        >
                            <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                {product.images?.[0] ? (
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                        Нет фото
                                    </div>
                                )}
                            </div>
                            <div className="ml-4 flex-1">
                                <div className="font-medium text-gray-800 truncate">{product.name}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {product.discount_price ? (
                                        <>
                                            <span className="text-red-600 font-medium">{product.discount_price.toLocaleString()} ₽</span>
                                            <span className="ml-2 line-through text-gray-400">{product.price.toLocaleString()} ₽</span>
                                        </>
                                    ) : (
                                        <span>{product.price.toLocaleString()} ₽</span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                    {!loading && results.length > 0 && (
                        <Link
                            to={`/search?q=${encodeURIComponent(query)}`}
                            className="block p-3 text-center text-blue-600 hover:bg-gray-50 border-t border-gray-200"
                            onClick={handleSelectProduct}
                        >
                            Все результаты ({results.length}+)
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductSearch;