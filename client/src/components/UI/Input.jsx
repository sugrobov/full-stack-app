import React from 'react';

const Input = React.forwardRef(({ 
  type = 'text', 
  label, 
  id, 
  name, 
  value, 
  onChange, 
  required, 
  placeholder, 
  error,
  className = '',
  ...props 
}, ref) => {
  const inputClasses = `w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
    error ? 'border-red-500' : 'border-gray-300'
  } ${className}`;
  
  const labelClasses = "block text-sm font-medium text-gray-700 mb-2";
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id || name} className={labelClasses}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          ref={ref}
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={inputClasses}
          {...props}
        />
      ) : (
        <input
          ref={ref}
          type={type}
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={inputClasses}
          {...props}
        />
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});

export default Input;