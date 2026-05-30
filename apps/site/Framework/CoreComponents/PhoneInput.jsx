import React, { forwardRef, useState, useEffect } from 'react';
import { Phone, X } from 'lucide-react';

/**
 * PhoneInput Component
 * 
 * Brazilian phone number format input with auto-formatting.
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.value - Phone number value
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.required - Show required asterisk
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.includeCountryCode - Include +55 country code
 * @param {('mobile'|'landline'|'both')} props.type - Phone type filter
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 */
export const PhoneInput = forwardRef(({
  label,
  value = '',
  onChange,
  required = false,
  disabled = false,
  includeCountryCode = false,
  type = 'both',
  placeholder = '(00) 00000-0000',
  className = '',
  ...props
}, ref) => {
  const [inputValue, setInputValue] = useState('');

  // Format phone number to Brazilian format
  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Determine if it's mobile (11 digits) or landline (10 digits)
    const isMobile = digits.length === 11;
    const isLandline = digits.length === 10;

    // Filter by type
    if (type === 'mobile' && isLandline && digits.length >= 10) return;
    if (type === 'landline' && isMobile && digits.length >= 11) return;

    // Format based on length
    if (digits.length === 0) return '';

    let formatted = '';

    if (includeCountryCode && digits.length > 2) {
      // +55 (XX) XXXXX-XXXX
      formatted = '+55 ';
      const ddd = digits.slice(2, 4);
      const firstPart = digits.slice(4, isMobile ? 9 : 8);
      const secondPart = digits.slice(isMobile ? 9 : 8, isMobile ? 13 : 12);

      if (ddd) formatted += `(${ddd}`;
      if (ddd?.length === 2) formatted += ') ';
      if (firstPart) formatted += firstPart;
      if (firstPart && secondPart) formatted += '-';
      if (secondPart) formatted += secondPart;
    } else {
      // (XX) XXXXX-XXXX or (XX) XXXX-XXXX
      const ddd = digits.slice(0, 2);
      const firstPart = digits.slice(2, isMobile ? 7 : 6);
      const secondPart = digits.slice(isMobile ? 7 : 6, isMobile ? 11 : 10);

      if (ddd) formatted += `(${ddd}`;
      if (ddd?.length === 2) formatted += ') ';
      if (firstPart) formatted += firstPart;
      if (firstPart && secondPart) formatted += '-';
      if (secondPart) formatted += secondPart;
    }

    return formatted;
  };

  // Update input when value prop changes
  useEffect(() => {
    setInputValue(formatPhoneNumber(value));
  }, [value]);

  const handleChange = (e) => {
    const rawValue = e.target.value;
    const formatted = formatPhoneNumber(rawValue);
    setInputValue(formatted);

    // Extract digits only for the value
    const digits = rawValue.replace(/\D/g, '');
    const finalValue = includeCountryCode ? `55${digits}` : digits;
    onChange?.(finalValue, formatted);
  };

  const handleClear = () => {
    setInputValue('');
    onChange?.('', '');
  };

  const isValidPhone = () => {
    const digits = inputValue.replace(/\D/g, '');
    const length = includeCountryCode ? digits.length : digits.length;
    const isMobile = length === 11;
    const isLandline = length === 10;
    return isMobile || isLandline;
  };

  const getPhoneType = () => {
    const digits = inputValue.replace(/\D/g, '');
    if (includeCountryCode) {
      if (digits.length === 13) return 'mobile';
      if (digits.length === 12) return 'landline';
    } else {
      if (digits.length === 11) return 'mobile';
      if (digits.length === 10) return 'landline';
    }
    return null;
  };

  return (
    <div className="relative">
      {label && (
        <label className={`block text-sm font-medium text-gray-400 mb-1.5 ${disabled ? 'opacity-50' : ''}`}>
          {label}
          {required && <span className="ml-1 text-amber-500">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Phone className="w-5 h-5 text-gray-500" strokeWidth={2} />
        </div>
        <input
          ref={ref}
          type="tel"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-12 py-3
            text-white placeholder-gray-500 focus:outline-none focus:ring-2
            focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isValidPhone() ? 'border-emerald-500' : ''}
            ${className}`}
          aria-invalid={!isValidPhone() && inputValue.length > 0}
          maxLength={includeCountryCode ? 19 : 15}
          {...props}
        />
        {inputValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
            aria-label="Clear phone number"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        )}
      </div>
      {inputValue.length > 0 && (
        <div className="mt-1.5 flex items-center justify-between">
          <span className={`text-xs ${isValidPhone() ? 'text-emerald-400' : 'text-gray-500'}`}>
            {isValidPhone()
              ? `Valid ${getPhoneType() === 'mobile' ? 'mobile' : getPhoneType() === 'landline' ? 'landline' : ''} number`
              : 'Enter a valid phone number'
            }
          </span>
          <span className="text-xs text-gray-500">
            {inputValue.replace(/\D/g, '').length} digits
          </span>
        </div>
      )}
    </div>
  );
});

PhoneInput.displayName = 'PhoneInput';

/**
 * PhoneInputMask - Simple mask version for non-Brazilian numbers
 */
export const PhoneInputMask = forwardRef(({
  label,
  value = '',
  onChange,
  mask = '(000) 000-0000',
  maskChar = '0',
  required = false,
  disabled = false,
  placeholder = '(000) 000-0000',
  className = '',
  ...props
}, ref) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const applyMask = (value) => {
    let result = '';
    let valueIndex = 0;

    for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
      if (mask[i] === maskChar) {
        result += value[valueIndex];
        valueIndex++;
      } else {
        result += mask[i];
        if (value[valueIndex] === mask[i]) {
          valueIndex++;
        }
      }
    }

    return result;
  };

  const handleChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // Remove non-digits
    const formatted = applyMask(rawValue);
    setInputValue(formatted);
    onChange?.(rawValue, formatted);
  };

  return (
    <div className="relative">
      {label && (
        <label className={`block text-sm font-medium text-gray-400 mb-1.5 ${disabled ? 'opacity-50' : ''}`}>
          {label}
          {required && <span className="ml-1 text-amber-500">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Phone className="w-5 h-5 text-gray-500" strokeWidth={2} />
        </div>
        <input
          ref={ref}
          type="tel"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 py-3
            text-white placeholder-gray-500 focus:outline-none focus:ring-2
            focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          maxLength={mask.length}
          {...props}
        />
      </div>
    </div>
  );
});

PhoneInputMask.displayName = 'PhoneInputMask';

export default PhoneInput;
