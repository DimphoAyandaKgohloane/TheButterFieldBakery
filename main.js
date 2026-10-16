/* =========================================================
   Butterfield Bakery - main.js
   Runs on EVERY page. It does three small jobs:
   1. Highlights the navigation link for the page you are on.
   2. Keeps the footer year up to date.
   3. Shows a live "Open now / Closed now" message.
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  highlightActiveNav();
  setFooterYear();
  showOpeningStatus();
  // Re-check every minute so the message stays correct if the page stays open
  setInterval(showOpeningStatus, 60000);
});

/* ---------- 1. Highlight the current page in the menu ---------- */
function highlightActiveNav() {
  // e.g. "/butterfield-bakery/products.html" -> "products.html"
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  var links = document.querySelectorAll('nav a');

  links.forEach(function (link) {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
      // aria-current helps screen readers know which page is open
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* ---------- 2. Footer year ---------- */
function setFooterYear() {
  var year = new Date().getFullYear();
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = year;
  });
}

/* ---------- 3. Open / Closed status ---------- */
// Opening hours: day number (0 = Sunday ... 6 = Saturday) -> [open hour, close hour]
// A day that is missing means the shop is closed that day.
var OPENING_HOURS = {
  main:     { 1: [8, 17], 2: [8, 17], 3: [8, 17], 4: [8, 17], 5: [8, 17], 6: [8, 17] },
  hatfield: { 1: [7, 16], 2: [7, 16], 3: [7, 16], 4: [7, 16], 5: [7, 16] }
};
var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Gets the current day and time in South Africa, whatever the visitor's own timezone is
function getSouthAfricaTime() {
  var parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Johannesburg',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23'
  }).formatToParts(new Date());

  var info = {};
  parts.forEach(function (p) { info[p.type] = p.value; });

  var dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(info.weekday);
  return { day: dayIndex, minutes: Number(info.hour) * 60 + Number(info.minute) };
}

function formatHour(hour) {
  return (hour < 10 ? '0' : '') + hour + ':00';
}

// Works out the message for one location ("main" or "hatfield")
function getStatusMessage(locationKey) {
  var hours = OPENING_HOURS[locationKey];
  var now = getSouthAfricaTime();
  var today = hours[now.day];

  // Open right now?
  if (today && now.minutes >= today[0] * 60 && now.minutes < today[1] * 60) {
    return { isOpen: true, text: 'Open now - closes at ' + formatHour(today[1]) };
  }

  // Closed, but opening later today?
  if (today && now.minutes < today[0] * 60) {
    return { isOpen: false, text: 'Closed now - opens today at ' + formatHour(today[0]) };
  }

  // Otherwise find the next day we open (look up to 7 days ahead)
  for (var i = 1; i <= 7; i++) {
    var nextDay = (now.day + i) % 7;
    if (hours[nextDay]) {
      var when = i === 1 ? 'tomorrow' : DAY_NAMES[nextDay];
      return { isOpen: false, text: 'Closed now - opens ' + when + ' at ' + formatHour(hours[nextDay][0]) };
    }
  }
  return { isOpen: false, text: 'Closed now' };
}

function showOpeningStatus() {
  document.querySelectorAll('[data-open-status]').forEach(function (el) {
    var status = getStatusMessage(el.getAttribute('data-open-status'));
    el.textContent = status.text;
    el.classList.remove('open', 'closed');
    el.classList.add(status.isOpen ? 'open' : 'closed');
  });
}
