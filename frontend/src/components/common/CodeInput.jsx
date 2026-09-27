import React, { useRef } from 'react';

const CodeInput = ({ value, onChange, onComplete, length = 6, disabled = false, className = '', inputProps = {} }) => {
  const completedValueRef = useRef('');

  const handleChange = (event) => {
    const nextValue = event.target.value.replace(/\D/g, '').slice(0, length);
    onChange(nextValue);
    if (nextValue.length < length) completedValueRef.current = '';
    if (nextValue.length === length && nextValue !== completedValueRef.current) {
      completedValueRef.current = nextValue;
      onComplete?.(nextValue);
    }
  };

  return (
    <input
      {...inputProps}
      type="text"
      inputMode="numeric"
      pattern={`[0-9]{${length}}`}
      maxLength={length}
      autoComplete="one-time-code"
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className={className}
    />
  );
};

export default CodeInput;