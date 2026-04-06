import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { LOCALE_OPTIONS, type Locale } from '../i18n'

type LanguageSwitcherProps = {
  ariaLabel: string
  locale: Locale
  onChange: (locale: Locale) => void
}

const ASSET_BASE = import.meta.env.BASE_URL

export default function LanguageSwitcher(props: LanguageSwitcherProps) {
  const { ariaLabel, locale, onChange } = props
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])

  const currentIndex = Math.max(
    0,
    LOCALE_OPTIONS.findIndex((option) => option.value === locale),
  )
  const currentOption = LOCALE_OPTIONS[currentIndex] ?? LOCALE_OPTIONS[0]

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!isOpen || !rootRef.current || rootRef.current.contains(event.target as Node)) {
        return
      }

      setIsOpen(false)
    }

    function handleDocumentKeydown(event: KeyboardEvent) {
      if (!isOpen || event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      setIsOpen(false)
      window.requestAnimationFrame(() => buttonRef.current?.focus())
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleDocumentKeydown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleDocumentKeydown)
    }
  }, [isOpen])

  function focusOption(index: number) {
    const nextIndex = (index + LOCALE_OPTIONS.length) % LOCALE_OPTIONS.length
    optionRefs.current[nextIndex]?.focus()
  }

  function openMenu(index = currentIndex) {
    setIsOpen(true)
    window.requestAnimationFrame(() => focusOption(index))
  }

  function closeMenu(focusButton = true) {
    setIsOpen(false)

    if (focusButton) {
      window.requestAnimationFrame(() => buttonRef.current?.focus())
    }
  }

  function chooseLocale(nextLocale: Locale) {
    if (nextLocale !== locale) {
      onChange(nextLocale)
    }

    closeMenu(false)
    window.requestAnimationFrame(() => buttonRef.current?.focus())
  }

  function handleButtonKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      openMenu(currentIndex)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      openMenu(currentIndex - 1)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (isOpen) {
        closeMenu(false)
      } else {
        openMenu(currentIndex)
      }
    }
  }

  function handleOptionKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusOption(index + 1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusOption(index - 1)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      focusOption(0)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      focusOption(LOCALE_OPTIONS.length - 1)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu()
      return
    }

    if (event.key === 'Tab') {
      closeMenu(false)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      chooseLocale(LOCALE_OPTIONS[index].value)
    }
  }

  return (
    <div
      ref={rootRef}
      className={`document-language-switcher language-switcher--enhanced ${
        isOpen ? 'is-open' : ''
      }`}
    >
      <button
        ref={buttonRef}
        type="button"
        className="language-picker__button toy-btn"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`${ariaLabel}: ${currentOption.label}`}
        onClick={() => {
          if (isOpen) {
            closeMenu(false)
          } else {
            openMenu(currentIndex)
          }
        }}
        onKeyDown={handleButtonKeyDown}
      >
        <img
          className="language-switcher__flag"
          src={`${ASSET_BASE}flags/${currentOption.flagCode}.svg`}
          alt=""
          aria-hidden="true"
        />
        <span className="language-picker__label">{currentOption.label}</span>
        <div className="language-switcher__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      <div
        id={menuId}
        className="language-picker__menu"
        role="listbox"
        aria-label={ariaLabel}
        hidden={!isOpen}
      >
        <div className="language-picker__options">
          {LOCALE_OPTIONS.map((option, index) => (
            <button
              key={option.value}
              ref={(node) => {
                optionRefs.current[index] = node
              }}
              type="button"
              className="language-picker__option"
              role="option"
              aria-selected={option.value === locale}
              onClick={() => chooseLocale(option.value)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
            >
              <img
                className="language-picker__option-flag"
                src={`${ASSET_BASE}flags/${option.flagCode}.svg`}
                alt=""
                aria-hidden="true"
              />
              <span className="language-picker__option-label">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
