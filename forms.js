/* =========================================================
   Butterfield Bakery - forms.js
   Runs on the ENQUIRY and CONTACT pages.
   It checks what the visitor types, shows friendly error
   messages, and shows a thank-you message when all is well.

   NOTE: There is no server yet, so nothing is actually sent
   anywhere. 
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var enquiryForm = document.getElementById('enquiry-form');
  var contactForm = document.getElementById('contact-form-element');

  if (enquiryForm) { setupForm(enquiryForm, 'enquiry'); }
  if (contactForm) { setupForm(contactForm, 'contact'); }
});

/* =========================================================
   1. VALIDATION RULES
   Each rule gets the input and returns an error message,
   or an empty string '' when the value is fine.
   ========================================================= */
function checkName(input) {
  var value = input.value.trim();
  if (value === '') { return 'Please enter your full name.'; }
  // Letters (including accents), spaces, apostrophes, dots and hyphens only
  if (!/^[\p{L}][\p{L}' .-]{1,59}$/u.test(value)) {
    return 'Please use letters only (at least 2 characters).';
  }
  return '';
}

function checkEmail(input) {
  var value = input.value.trim();
  if (value === '') { return 'Please enter your email address.'; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    return 'Please enter a valid email, like name@example.com.';
  }
  return '';
}

function checkPhone(input) {
  var value = input.value.trim();
  if (value === '') { return ''; } // phone is optional
  // Remove spaces, dashes and brackets, then expect 0XXXXXXXXX or +27XXXXXXXXX
  var digits = value.replace(/[\s\-()]/g, '');
  if (!/^(\+27|0)\d{9}$/.test(digits)) {
    return 'Enter a South African number, e.g. 012 323 9340 or +27 12 323 9340.';
  }
  return '';
}

function checkMessage(input) {
  var value = input.value.trim();
  if (value === '') { return 'Please type your message.'; }
  if (value.length < 10) { return 'Please write at least 10 characters so we can help you.'; }
  return '';
}

function checkDate(input) {
  if (input.value === '') {
    return input.required ? 'Please choose a date.' : '';
  }
  // Dates look like 2026-10-15, so they can be compared as plain text
  if (input.min && input.value < input.min) {
    return 'Please choose a date from tomorrow onwards. We need some notice to bake.';
  }
  return '';
}

function checkNumber(input) {
  var value = input.value.trim();
  if (value === '') {
    return input.required ? 'Please enter a number.' : '';
  }
  var number = Number(value);
  if (!Number.isInteger(number)) { return 'Please enter a whole number.'; }
  if (number < Number(input.min) || number > Number(input.max)) {
    return 'Please enter a number between ' + input.min + ' and ' + input.max + '.';
  }
  return '';
}

// Which rule belongs to which field (matched by the field's id)
var RULES = {
  'full-name': checkName,
  'c-name': checkName,
  'email': checkEmail,
  'c-email': checkEmail,
  'phone': checkPhone,
  'message': checkMessage,
  'c-message': checkMessage,
  'needed-date': checkDate,
  'servings': checkNumber,
  'guests': checkNumber
};

/* =========================================================
   2. EXTRA FIELDS THAT CHANGE WITH THE ENQUIRY TYPE
   ========================================================= */
var EXTRA_FIELDS = {
  'custom-cake': [
    { id: 'needed-date', label: 'Date needed', type: 'date', required: true },
    { id: 'servings', label: 'Servings (how many people?)', type: 'number', min: 1, max: 200, required: false }
  ],
  'bulk-order': [
    { id: 'needed-date', label: 'Collection date', type: 'date', required: true }
  ],
  'catering': [
    { id: 'needed-date', label: 'Event date', type: 'date', required: true },
    { id: 'guests', label: 'Number of guests', type: 'number', min: 10, max: 500, required: true }
  ],
  'other': []
};

// Returns tomorrow's date as "YYYY-MM-DD" (used as the earliest allowed date)
function getTomorrow() {
  var d = new Date();
  d.setDate(d.getDate() + 1);
  var month = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + month + '-' + day;
}

/* =========================================================
   3. SETTING UP A FORM
   ========================================================= */
function setupForm(form, formType) {
  // Turn off the browser's own pop-up messages so ours are shown instead.
  // (The "required" attributes stay in the HTML as a backup if JS fails.)
  form.noValidate = true;

  // A box above the form for success / error summaries
  var status = document.createElement('div');
  status.className = 'form-status';
  status.setAttribute('role', 'status');
  status.tabIndex = -1; // lets us move keyboard focus here
  status.hidden = true;
  form.before(status);

  // Set up every field that already exists in the HTML
  form.querySelectorAll('input, select, textarea').forEach(setupField);

  // Enquiry form only: extra fields that depend on the enquiry type
  var typeSelect = form.querySelector('#enquiry-type');
  var extraBox = null;
  if (typeSelect) {
    extraBox = document.createElement('div');
    extraBox.id = 'extra-fields';
    typeSelect.closest('p').after(extraBox);
    typeSelect.addEventListener('change', function () { renderExtraFields(extraBox, typeSelect.value); });
    renderExtraFields(extraBox, typeSelect.value);
  }

  // When the visitor presses the submit button
  form.addEventListener('submit', function (event) {
    event.preventDefault(); // stop the page from reloading

    var fields = Array.from(form.querySelectorAll('input, select, textarea'));
    var firstBad = null;
    var badCount = 0;

    fields.forEach(function (field) {
      if (!validateField(field)) {
        badCount++;
        if (!firstBad) { firstBad = field; }
      }
    });

    if (badCount > 0) {
      showStatus(status, 'error', badCount === 1
        ? 'Please fix 1 problem below and try again.'
        : 'Please fix ' + badCount + ' problems below and try again.');
      firstBad.focus();
      return;
    }

    handleSuccess(form, formType, status, typeSelect, extraBox);
  });
}

// Adds the error message space, the live checking and (for textareas) a letter counter
function setupField(field) {
  if (!RULES[field.id]) { return; }

  var error = document.createElement('span');
  error.className = 'error-message';
  error.id = field.id + '-error';
  field.after(error);
  field.setAttribute('aria-describedby', error.id);

  if (field.tagName === 'TEXTAREA') {
    field.maxLength = 500;
    var counter = document.createElement('small');
    counter.className = 'char-count';
    error.after(counter);
    var updateCounter = function () { counter.textContent = field.value.length + ' / 500'; };
    field.addEventListener('input', updateCounter);
    field.addEventListener('reset-counter', updateCounter);
    updateCounter();
  }

  // Check when the visitor leaves the field...
  field.addEventListener('blur', function () { validateField(field); });
  // ...and keep re-checking while they fix a field that was wrong
  field.addEventListener('input', function () {
    if (field.classList.contains('invalid')) { validateField(field); }
  });
  field.addEventListener('change', function () { validateField(field); });
}

// Checks one field, shows or clears its message, returns true if it is fine
function validateField(field) {
  var rule = RULES[field.id];
  if (!rule) { return true; }

  var message = rule(field);
  var errorBox = document.getElementById(field.id + '-error');
  errorBox.textContent = message;

  field.classList.toggle('invalid', message !== '');
  field.classList.toggle('valid', message === '' && field.value.trim() !== '');
  field.setAttribute('aria-invalid', message !== '' ? 'true' : 'false');
  return message === '';
}

// Builds the extra fields for the chosen enquiry type
function renderExtraFields(container, type) {
  container.innerHTML = '';
  (EXTRA_FIELDS[type] || []).forEach(function (config) {
    var p = document.createElement('p');

    var label = document.createElement('label');
    label.setAttribute('for', config.id);
    label.textContent = config.label + ':';

    var input = document.createElement('input');
    input.type = config.type;
    input.id = config.id;
    input.name = config.id;
    input.required = config.required;
    if (config.type === 'date') { input.min = getTomorrow(); }
    if (config.type === 'number') { input.min = config.min; input.max = config.max; }

    p.appendChild(label);
    p.appendChild(document.createElement('br'));
    p.appendChild(input);
    container.appendChild(p);
    setupField(input);
  });
}

function showStatus(box, kind, text) {
  box.textContent = text;
  box.className = 'form-status ' + kind;
  box.hidden = false;
  box.focus();
}

/* =========================================================
   4. WHEN EVERYTHING IS VALID
   ========================================================= */
function handleSuccess(form, formType, status, typeSelect, extraBox) {
  var nameField = form.querySelector('#full-name, #c-name');
  var emailField = form.querySelector('#email, #c-email');
  var firstName = nameField.value.trim().split(' ')[0];
  var email = emailField.value.trim();

  // TODO (later): send the form data to a real service here, for example
  // with fetch('https://formspree.io/f/your-id', { method: 'POST', body: new FormData(form) })

  var text;
  if (formType === 'enquiry') {
    var typeName = typeSelect.options[typeSelect.selectedIndex].text;
    text = 'Thank you, ' + firstName + '! Your enquiry (' + typeName + ') has been received. ' +
           'We will get back to you at ' + email + '.';
  } else {
    text = 'Thank you, ' + firstName + '! Your message has been received. ' +
           'We will reply to ' + email + '.';
  }

  // Clear the form and all the ticks / crosses
  form.reset();
  form.querySelectorAll('.error-message').forEach(function (e) { e.textContent = ''; });
  form.querySelectorAll('.valid, .invalid').forEach(function (f) { f.classList.remove('valid', 'invalid'); f.removeAttribute('aria-invalid'); });
  form.querySelectorAll('textarea').forEach(function (t) { t.dispatchEvent(new Event('reset-counter')); });
  if (extraBox) { renderExtraFields(extraBox, typeSelect.value); }

  showStatus(status, 'success', text);
}
