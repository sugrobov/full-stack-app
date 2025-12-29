import React from 'react';

const Select = React.forwardRef(({ 
  label, 
  id, 
  name, 
  value, 
  onChange, 
  required, 
  children, 
  error,
  className = '',
  ...props 
}, ref) => {
  const selectClasses = `w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
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
      <select
        ref={ref}
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={selectClasses}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});

export default Select;