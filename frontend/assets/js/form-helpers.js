/* ═══════════════════════════════════════
   ARYANA CURRENCY — Form Helpers
   Password toggle, English-only input, validation
   ═══════════════════════════════════════ */

/**
 * جلوگیری از تایپ کاراکترهای غیر انگلیسی (فارسی/عربی) در فیلد ورودی
 * فقط حروف انگلیسی، اعداد، و کاراکترهای مجاز ایمیل
 */
function preventNonEnglish(inputEl, options = {}) {
  if (!inputEl) return;

  const allowSpaces = options.allowSpaces || false;

  // الگوی مجاز: حروف a-z، اعداد 0-9، و کاراکترهای ایمیل
  const emailPattern = /[^a-zA-Z0-9@._\-+]/g;
  const namePattern = /[^a-zA-Z0-9\s'.\-]/g;
  const numberPattern = /[^0-9+\s\-()]/g;

  const pattern = options.mode === 'name'
    ? namePattern
    : options.mode === 'phone'
      ? numberPattern
      : emailPattern;

  // جلوگیری از تایپ مستقیم
  inputEl.addEventListener('beforeinput', (e) => {
    if (e.data && pattern.test(e.data)) {
      e.preventDefault();
      return false;
    }
  });

  // پاک‌سازی ورودی‌های paste شده
  inputEl.addEventListener('input', (e) => {
    const cleaned = e.target.value.replace(pattern, '');
    if (cleaned !== e.target.value) {
      const pos = e.target.selectionStart;
      e.target.value = cleaned;
      e.target.setSelectionRange(pos - 1, pos - 1);
    }
  });

  // جلوگیری از paste محتوای غیرمجاز
  inputEl.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const cleaned = pasted.replace(pattern, '');
    const start = inputEl.selectionStart;
    const end = inputEl.selectionEnd;
    const value = inputEl.value;
    inputEl.value = value.slice(0, start) + cleaned + value.slice(end);
    inputEl.setSelectionRange(start + cleaned.length, start + cleaned.length);
  });
}

/**
 * اضافه کردن دکمه Show/Hide Password به یه فیلد رمز
 */
function attachPasswordToggle(inputId, buttonId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(buttonId);

  if (!input || !btn) return;

  // ذخیره HTML اصلی برای برگرداندن
  const eyeOpenSVG = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `;

  const eyeClosedSVG = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  `;

  btn.innerHTML = eyeOpenSVG;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.innerHTML = isPassword ? eyeClosedSVG : eyeOpenSVG;
    btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  });
}

/**
 * اعتبارسنجی ایمیل
 */
function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
}

/**
 * اعتبارسنجی شماره تماس
 */
function isValidPhone(phone) {
  return /^[+]?[0-9\s\-()]{7,20}$/.test(phone);
}