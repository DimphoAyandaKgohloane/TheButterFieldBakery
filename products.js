/* =========================================================
   Butterfield Bakery - products.js
   Runs on the PRODUCTS page only.
   Adds a search box, a category filter and a price sort
   on top of the existing product tables.
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var sections = Array.from(document.querySelectorAll('main > section'));
  if (sections.length === 0) { return; }

  /* ----- Step 1: collect every product row from the tables ----- */
  var products = [];
  sections.forEach(function (section) {
    section.querySelectorAll('tbody tr').forEach(function (row, index) {
      var cells = row.children;
      products.push({
        row: row,
        section: section,
        originalOrder: index,
        // Name + description in lowercase, used for searching
        searchText: (cells[0].textContent + ' ' + cells[1].textContent).toLowerCase(),
        // "R28" -> 28
        price: parseInt(cells[2].textContent.replace(/\D/g, ''), 10)
      });
    });
  });

  /* ----- Step 2: build the search / filter / sort controls ----- */
  var tools = document.createElement('div');
  tools.id = 'product-tools';
  tools.className = 'product-tools';
  tools.setAttribute('role', 'search');

  tools.appendChild(makeField('Search products:', makeInput()));
  tools.appendChild(makeField('Category:', makeCategorySelect()));
  tools.appendChild(makeField('Sort by:', makeSortSelect()));

  var clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.id = 'product-reset';
  clearButton.textContent = 'Clear filters';
  var clearWrap = document.createElement('p');
  clearWrap.appendChild(clearButton);
  tools.appendChild(clearWrap);

  var countMessage = document.createElement('p');
  countMessage.id = 'product-count';
  countMessage.setAttribute('aria-live', 'polite'); // screen readers announce changes
  tools.appendChild(countMessage);

  // Put the controls above the first product section
  sections[0].before(tools);

  var searchBox = document.getElementById('product-search');
  var categoryBox = document.getElementById('product-category');
  var sortBox = document.getElementById('product-sort');

  /* ----- Step 3: apply the filters whenever something changes ----- */
  searchBox.addEventListener('input', updateProducts);
  categoryBox.addEventListener('change', updateProducts);
  sortBox.addEventListener('change', updateProducts);
  clearButton.addEventListener('click', function () {
    searchBox.value = '';
    categoryBox.value = 'all';
    sortBox.value = 'default';
    updateProducts();
    searchBox.focus();
  });

  updateProducts();

  function updateProducts() {
    var query = searchBox.value.trim().toLowerCase();
    var category = categoryBox.value;
    var visibleCount = 0;

    // Show or hide each row
    products.forEach(function (product) {
      var matchesSearch = product.searchText.indexOf(query) !== -1;
      var matchesCategory = category === 'all' || product.section.id === category;
      var show = matchesSearch && matchesCategory;
      product.row.hidden = !show;
      if (show) { visibleCount++; }
    });

    // Sort the rows inside each table
    sections.forEach(function (section) {
      var body = section.querySelector('tbody');
      var rows = products.filter(function (p) { return p.section === section; });

      if (sortBox.value === 'price-low') {
        rows.sort(function (a, b) { return a.price - b.price; });
      } else if (sortBox.value === 'price-high') {
        rows.sort(function (a, b) { return b.price - a.price; });
      } else {
        rows.sort(function (a, b) { return a.originalOrder - b.originalOrder; });
      }
      rows.forEach(function (p) { body.appendChild(p.row); });

      // Hide a whole section (heading + table) if none of its rows match
      var hasVisibleRow = rows.some(function (p) { return !p.row.hidden; });
      section.hidden = !hasVisibleRow;
    });

    // Tell the visitor what is showing
    if (visibleCount === 0) {
      countMessage.textContent = 'No products match your search. Try a different word or clear the filters.';
    } else {
      countMessage.textContent = 'Showing ' + visibleCount + ' of ' + products.length + ' products.';
    }
  }

  /* ----- Small helper functions that build the form controls ----- */
  function makeField(labelText, control) {
    var wrap = document.createElement('p');
    var label = document.createElement('label');
    label.setAttribute('for', control.id);
    label.textContent = labelText;
    wrap.appendChild(label);
    wrap.appendChild(document.createElement('br'));
    wrap.appendChild(control);
    return wrap;
  }

  function makeInput() {
    var input = document.createElement('input');
    input.type = 'search';
    input.id = 'product-search';
    input.placeholder = 'e.g. croissant';
    return input;
  }

  function makeCategorySelect() {
    var select = document.createElement('select');
    select.id = 'product-category';
    select.appendChild(new Option('All products', 'all'));
    // One option per section, using the section's own heading text
    sections.forEach(function (section) {
      var heading = section.querySelector('h2');
      if (heading) { select.appendChild(new Option(heading.textContent, section.id)); }
    });
    return select;
  }

  function makeSortSelect() {
    var select = document.createElement('select');
    select.id = 'product-sort';
    select.appendChild(new Option('Our order', 'default'));
    select.appendChild(new Option('Price: low to high', 'price-low'));
    select.appendChild(new Option('Price: high to low', 'price-high'));
    return select;
  }
});
