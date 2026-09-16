let booksDatabase = [
  { id: "1", title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "9780061120084", status: "Available", borrower: "" },
  { id: "2", title: "1984", author: "George Orwell", isbn: "9780451524935", status: "Checked Out", borrower: "Alex Smith", dueDate: "2026-09-10" },
  { id: "3", title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "9780743273565", status: "Available", borrower: "" }
];

let selectedBookForHold = null;

document.addEventListener("DOMContentLoaded", () => {
  renderCatalog();
  renderCirculationTable();
  setupBarcodeListener();
});

function toggleRole(role) {
  if (role === 'student') {
    document.querySelectorAll('.librarian-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.student-only').forEach(el => el.style.display = 'inline-block');
    switchTab('catalog');
  } else {
    document.querySelectorAll('.librarian-only').forEach(el => el.style.display = 'inline-block');
    document.querySelectorAll('.student-only').forEach(el => el.style.display = 'none');
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(tabId).classList.add('active');
  if (event && event.target) {
    event.target.classList.add('active');
  }
}

function renderCatalog() {
  const grid = document.getElementById('catalogGrid');
  grid.innerHTML = '';

  booksDatabase.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
      <div>
        <h3>${book.title}</h3>
        <p><strong>Author:</strong> ${book.author}</p>
        <p><strong>ISBN:</strong> ${book.isbn}</p>
        <span class="status-tag status-${book.status.split(' ')[0]}">${book.status}</span>
        <svg id="barcode-${book.isbn}" class="barcode-svg"></svg>
      </div>
      <div style="margin-top: 1rem;">
        ${book.status === 'Available' ? `<button class="btn-primary" onclick="openHoldModal('${book.isbn}')">Place on Hold</button>` : `<button class="btn-secondary" disabled>Unavailable</button>`}
      </div>
    `;
    grid.appendChild(card);

    JsBarcode(`#barcode-${book.isbn}`, book.isbn, {
      format: "CODE128",
      height: 40,
      displayValue: false
    });
  });
}

function setupBarcodeListener() {
  const input = document.getElementById('barcodeInput');
  if (input) {
    input.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        const scannedCode = input.value.trim();
        processScannedBarcode(scannedCode);
        input.value = '';
      }
    });
  }
}

function processScannedBarcode(code) {
  const matchedBook = booksDatabase.find(b => b.isbn === code || b.id === code);
  if (matchedBook) {
    switchTab('circulation');
    document.getElementById('circBookId').value = matchedBook.isbn;
    alert(`Scanned: "${matchedBook.title}". Select Student and choose Check Out or Check In.`);
  } else {
    alert("Scanned ISBN not found in library database.");
  }
}

function importGoogleSheetData() {
  const rawText = document.getElementById('csvImportArea').value.trim();
  const rows = rawText.split('\n');
  
  rows.forEach((row) => {
    const cols = row.split(',').map(c => c.trim());
    if (cols.length >= 3) {
      booksDatabase.push({
        id: String(booksDatabase.length + 1),
        title: cols[0],
        author: cols[1],
        isbn: cols[2],
        status: cols[3] || "Available",
        borrower: ""
      });
    }
  });
  
  renderCatalog();
  alert("Google Sheet items successfully imported!");
  switchTab('catalog');
}

function openHoldModal(isbn) {
  selectedBookForHold = isbn;
  const book = booksDatabase.find(b => b.isbn === isbn);
  document.getElementById('holdBookTitle').innerText = `Book: ${book.title}`;
  document.getElementById('holdModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('holdModal').classList.add('hidden');
}

function confirmHold() {
  const studentName = document.getElementById('holdStudentName').value;
  if (!studentName) return alert("Please enter student name.");
  
  const book = booksDatabase.find(b => b.isbn === selectedBookForHold);
  book.status = "On Hold";
  book.borrower = studentName;
  
  renderCatalog();
  closeModal();
  alert(`Hold requested for ${studentName}!`);
}

function renderCirculationTable() {
  const table = document.getElementById('activeLoansTable');
  table.innerHTML = booksDatabase.filter(b => b.status === 'Checked Out').map(b => `
    <tr>
      <td>${b.borrower}</td>
      <td>${b.title}</td>
      <td>${b.dueDate || '2026-09-20'}</td>
      <td><span class="status-tag status-Checked">${b.status}</span></td>
      <td><button class="btn-secondary" onclick="quickCheckIn('${b.isbn}')">Return</button></td>
    </tr>
  `).join('');
}

function quickCheckIn(isbn) {
  const book = booksDatabase.find(b => b.isbn === isbn);
  book.status = 'Available';
  book.borrower = '';
  renderCatalog();
  renderCirculationTable();
}
