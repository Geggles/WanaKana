import { DEFAULT_OPTIONS } from './constants';
import convertFullwidthCharsToASCII from './utils/convertFullwidthCharsToASCII';
import toKana from './toKana';

const ELEMENTS = ['TEXTAREA', 'INPUT'];
let LISTENERS = [];

/**
 * Binds eventListener for 'input' events to an input field to automagically replace values with kana
 * Sets`autocapitalize="none"` on the input field to prevent mobile devices forcing the first input character to katakana.
 * @param  {HTMLElement} input textarea, input[type="text"] etc
 * @param  {DefaultOptions} [options=defaultOptions] user config overrides
 */
export function bind(input, options = {}) {
  const listener = onInput(options);
  if (input instanceof Element && ELEMENTS.includes(input.nodeName)) {
    input.autocapitalize = 'none'; // eslint-disable-line no-param-reassign
    input.addEventListener('input', listener);
    LISTENERS = LISTENERS.concat({ id: input.getAttribute('id'), handler: listener });
  } else {
    console.warn('Input provided to wanakana.bind was not a valid input field.'); // eslint-disable-line no-console
  }
}

/**
 * Unbinds eventListener from input field
 * @param  {HTMLElement} input textarea, input[type="text"] etc
 */
export function unbind(input) {
  const found = LISTENERS.find(({ id }) => id === input.id);
  if (found != null) {
    input.removeEventListener('input', found.handler);
    LISTENERS = LISTENERS.filter((entry) => entry.handler !== found.handler);
  } else {
    console.warn('Input had no listener registered.'); // eslint-disable-line no-console
  }
}

/**
 * Automagically replaces input values with converted text to kana
 * @param  {Object} event DOM event to listen to
 * @param  {defaultOptions} [options] user config overrides, default conversion is toKana()
 * @return {Function} event handler with bound options
 * @ignore
 */
function onInput(options) {
  const config = Object.assign({}, DEFAULT_OPTIONS, options);

  return function listener(event) {
    const input = event.target;
    // const startingCursor = input.selectionStart;
    // const startingLength = input.value.length;

    const normalizedInputString = convertFullwidthCharsToASCII(input.value);
    const hiraOrKataString = setKanaType(normalizedInputString, config.IMEMode);
    const ensureIMEModeConfig = Object.assign({}, config, { IMEMode: true });
    const newText = toKana(hiraOrKataString, ensureIMEModeConfig);

    if (normalizedInputString !== newText) {
      input.value = newText;

      // Modern browsers, set cursor to the end of the new text
      if (input.setSelectionRange != null && typeof input.selectionStart === 'number') {
        input.setSelectionRange(input.value.length, input.value.length);
        return;
      }
      // < IE 9
      if (input.createTextRange != null) {
        input.focus();
        const range = input.createTextRange();
        range.collapse(false);
        range.select();
      }
    }
  };
}

// easy way to still use `toKana` to handle IME input - but with forced conversion type
function setKanaType(input, flag) {
  switch (true) {
    case flag === 'toHiragana': return input.toLowerCase();
    case flag === 'toKatakana': return input.toUpperCase();
    default: return input;
  }
}
