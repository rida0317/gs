// src/components/AccessibleForm.tsx - Accessible form component

import React, { useRef, useEffect } from 'react'
import './AccessibleForm.css'

interface AccessibleFormProps {
  children: React.ReactNode
  title: string
  description?: string
  onSubmit: (e: React.FormEvent) => void
  isLoading?: boolean
  errors?: string[]
  className?: string
}

const AccessibleForm: React.FC<AccessibleFormProps> = ({
  children,
  title,
  description,
  onSubmit,
  isLoading = false,
  errors = [],
  className
}) => {
  const formRef = useRef<HTMLFormElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Focus on first input when form loads
    const firstInput = formRef.current?.querySelector('input, select, textarea')
    if (firstInput) {
      (firstInput as HTMLElement).focus()
    }
  }, [])

  useEffect(() => {
    // Announce errors to screen readers
    if (errors.length > 0 && errorRef.current) {
      errorRef.current.focus()
    }
  }, [errors])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submission
    const form = formRef.current
    if (form) {
      const formData = new FormData(form)
      const isValid = form.checkValidity()
      
      if (!isValid) {
        // Show validation messages
        const invalidInputs = form.querySelectorAll('input:invalid, select:invalid, textarea:invalid')
        if (invalidInputs.length > 0) {
          (invalidInputs[0] as HTMLElement).focus()
        }
        return
      }
    }
    
    onSubmit(e)
  }

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit}
      className={`accessible-form ${className || ''}`}
      noValidate
      aria-label={title}
    >
      <div className="accessible-form__header">
        <h2 className="accessible-form__title">{title}</h2>
        {description && (
          <p className="accessible-form__description">{description}</p>
        )}
      </div>

      {errors.length > 0 && (
        <div 
          ref={errorRef}
          className="accessible-form__errors"
          role="alert"
          aria-live="polite"
          tabIndex={-1}
        >
          <h3 className="accessible-form__error-title">Please correct the following errors:</h3>
          <ul className="accessible-form__error-list">
            {errors.map((error, index) => (
              <li key={index} className="accessible-form__error-item">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="accessible-form__content">
        {children}
      </div>

      <div className="accessible-form__actions">
        <button 
          type="submit"
          className="accessible-form__submit"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <span className="sr-only">Submitting...</span>
              <span aria-hidden="true">Submitting...</span>
            </>
          ) : (
            'Submit'
          )}
        </button>
      </div>
    </form>
  )
}

// Accessible input component
interface AccessibleInputProps {
  id: string
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  error?: string
  helpText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  min?: number
  max?: number
  step?: number
  className?: string
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  helpText,
  required = false,
  disabled = false,
  placeholder,
  min,
  max,
  step,
  className
}) => {
  const errorId = `${id}-error`
  const helpId = `${id}-help`

  return (
    <div className={`accessible-input ${className || ''}`}>
      <label htmlFor={id} className="accessible-input__label">
        {label}
        {required && <span className="accessible-input__required" aria-label="required">*</span>}
      </label>
      
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`accessible-input__field ${error ? 'accessible-input__field--error' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim()}
        aria-required={required}
        disabled={disabled}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        autoComplete={type === 'email' ? 'email' : type === 'password' ? 'current-password' : undefined}
      />
      
      {helpText && (
        <div id={helpId} className="accessible-input__help">
          {helpText}
        </div>
      )}
      
      {error && (
        <div id={errorId} className="accessible-input__error" role="alert" aria-live="polite">
          {error}
        </div>
      )}
    </div>
  )
}

// Accessible select component
interface AccessibleSelectProps {
  id: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void
  options: { value: string; label: string }[]
  error?: string
  helpText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

export const AccessibleSelect: React.FC<AccessibleSelectProps> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  options,
  error,
  helpText,
  required = false,
  disabled = false,
  placeholder,
  className
}) => {
  const errorId = `${id}-error`
  const helpId = `${id}-help`

  return (
    <div className={`accessible-select ${className || ''}`}>
      <label htmlFor={id} className="accessible-select__label">
        {label}
        {required && <span className="accessible-select__required" aria-label="required">*</span>}
      </label>
      
      <select
        id={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`accessible-select__field ${error ? 'accessible-select__field--error' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim()}
        aria-required={required}
        disabled={disabled}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {helpText && (
        <div id={helpId} className="accessible-select__help">
          {helpText}
        </div>
      )}
      
      {error && (
        <div id={errorId} className="accessible-select__error" role="alert" aria-live="polite">
          {error}
        </div>
      )}
    </div>
  )
}

// Accessible textarea component
interface AccessibleTextareaProps {
  id: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  error?: string
  helpText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  rows?: number
  maxLength?: number
  className?: string
}

export const AccessibleTextarea: React.FC<AccessibleTextareaProps> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  helpText,
  required = false,
  disabled = false,
  placeholder,
  rows = 4,
  maxLength,
  className
}) => {
  const errorId = `${id}-error`
  const helpId = `${id}-help`

  return (
    <div className={`accessible-textarea ${className || ''}`}>
      <label htmlFor={id} className="accessible-textarea__label">
        {label}
        {required && <span className="accessible-textarea__required" aria-label="required">*</span>}
      </label>
      
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`accessible-textarea__field ${error ? 'accessible-textarea__field--error' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim()}
        aria-required={required}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
      />
      
      {helpText && (
        <div id={helpId} className="accessible-textarea__help">
          {helpText}
        </div>
      )}
      
      {error && (
        <div id={errorId} className="accessible-textarea__error" role="alert" aria-live="polite">
          {error}
        </div>
      )}
    </div>
  )
}

// Screen reader only utility class
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
)

export default AccessibleForm