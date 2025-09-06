
// Offline Steel Bar Calculator - script.js

// Steel bar weight per meter (kg/m) for given diameters
const steelBarWeights = {
  8: 0.395,
  10: 0.617,
  12: 0.888,
  14: 1.210,
  16: 1.580,
  18: 2.000,
  20: 2.470,
  24: 3.550,
  32: 6.310
};

let currentQuote = [];
let savedQuotes = JSON.parse(localStorage.getItem("savedQuotes") || "[]");

// Elements
const diameterSelect = document.getElementById("diameter");
const quantityInput = document.getElementById("quantity");
const priceInput = document.getElementById("pricePerKg");
const vatCheckbox = document.getElementById("vatCheckbox");
const addItemBtn = document.getElementById("addItemBtn");
const itemsList = document.getElementById("quote-items-list");
const totalWeightEl = document.getElementById("quoteTotalWeight");
const totalPriceEl = document.getElementById("quoteTotalPrice");
const vatBreakdown = document.getElementById("vat-breakdown");
const vatAmountEl = document.getElementById("vatAmount");
const finalPriceEl = document.getElementById("finalPrice");
const saveQuoteBtn = document.getElementById("saveQuoteBtn");
const clearQuoteBtn = document.getElementById("clearQuoteBtn");
const exportBtn = document.getElementById("exportBtn");
const savedQuotesList = document.getElementById("saved-quotes-list");
const jobNameInput = document.getElementById("jobName");

// Modal elements
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalCancelBtn = document.getElementById("modal-cancel-btn");
const modalConfirmBtn = document.getElementById("modal-confirm-btn");
let modalConfirmAction = null;

// Initialize
function init() {
  // Populate diameter options
  for (const dia in steelBarWeights) {
    const option = document.createElement("option");
    option.value = dia;
    option.textContent = dia + " mm";
    diameterSelect.appendChild(option);
  }
  renderSavedQuotes();
  renderQuoteItems();
}

function openModal(title, message, onConfirm) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modal.classList.remove("hidden");
  modalConfirmAction = onConfirm;
}

function closeModal() {
  modal.classList.add("hidden");
  modalConfirmAction = null;
}

modalCancelBtn.addEventListener("click", closeModal);
modalConfirmBtn.addEventListener("click", () => {
  if (modalConfirmAction) modalConfirmAction();
  closeModal();
});

// Add item
addItemBtn.addEventListener("click", () => {
  const dia = parseInt(diameterSelect.value);
  const qty = parseInt(quantityInput.value);
  const pricePerKg = parseFloat(priceInput.value);
  if (!dia || !qty || !pricePerKg) {
    alert("Please fill in all fields");
    return;
  }
  const weightPerBar = steelBarWeights[dia] * 12; // 12m bar
  const totalWeight = weightPerBar * qty;
  const totalPrice = totalWeight * pricePerKg;
  currentQuote.push({ dia, qty, pricePerKg, weightPerBar, totalWeight, totalPrice });
  renderQuoteItems();
  quantityInput.value = "";
  priceInput.value = "";
});

// Render items
function renderQuoteItems() {
  itemsList.innerHTML = "";
  currentQuote.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "p-2 border rounded-lg flex justify-between items-center";
    div.innerHTML = `
      <span>${item.qty} × Ø${item.dia}mm (12m) = ${item.totalWeight.toFixed(2)} kg</span>
      <span>${item.totalPrice.toFixed(2)}</span>
      <button class="text-red-600 ml-2" onclick="removeItem(${index})">✕</button>
    `;
    itemsList.appendChild(div);
  });
  updateQuoteTotals();
}

// Remove item
window.removeItem = function(index) {
  currentQuote.splice(index, 1);
  renderQuoteItems();
};

// Update totals
function updateQuoteTotals() {
  let totalWeight = 0;
  let totalPrice = 0;
  currentQuote.forEach(i => {
    totalWeight += i.totalWeight;
    totalPrice += i.totalPrice;
  });
  totalWeightEl.textContent = totalWeight.toFixed(2) + " kg";
  totalPriceEl.textContent = totalPrice.toFixed(2);
  if (vatCheckbox.checked) {
    const vat = totalPrice * 0.15;
    const final = totalPrice + vat;
    vatBreakdown.classList.remove("hidden");
    vatAmountEl.textContent = vat.toFixed(2);
    finalPriceEl.textContent = final.toFixed(2);
  } else {
    vatBreakdown.classList.add("hidden");
  }
}

vatCheckbox.addEventListener("change", updateQuoteTotals);

// Save quote
saveQuoteBtn.addEventListener("click", () => {
  const jobName = jobNameInput.value.trim() || "Untitled";
  if (currentQuote.length === 0) {
    alert("No items in quote");
    return;
  }
  savedQuotes.push({
    name: jobName,
    items: currentQuote,
    vat: vatCheckbox.checked,
    createdAt: new Date().toISOString()
  });
  localStorage.setItem("savedQuotes", JSON.stringify(savedQuotes));
  currentQuote = [];
  jobNameInput.value = "";
  renderQuoteItems();
  renderSavedQuotes();
});

// Clear quote
clearQuoteBtn.addEventListener("click", () => {
  openModal("Clear Quote", "Are you sure you want to clear the current quote?", () => {
    currentQuote = [];
    renderQuoteItems();
  });
});

// Render saved quotes
function renderSavedQuotes() {
  savedQuotesList.innerHTML = "";
  savedQuotes.forEach((q, index) => {
    const div = document.createElement("div");
    div.className = "p-2 border rounded-lg flex justify-between items-center";
    div.innerHTML = `
      <span>${q.name} (${q.items.length} items)</span>
      <div class="space-x-2">
        <button class="text-blue-600" onclick="viewQuote(${index})">View</button>
        <button class="text-red-600" onclick="deleteQuote(${index})">Delete</button>
      </div>
    `;
    savedQuotesList.appendChild(div);
  });
}

// View saved quote
window.viewQuote = function(index) {
  const q = savedQuotes[index];
  let msg = "";
  q.items.forEach(i => {
    msg += `${i.qty} × Ø${i.dia}mm = ${i.totalWeight.toFixed(2)} kg → ${i.totalPrice.toFixed(2)}\n`;
  });
  openModal("Quote: " + q.name, msg, null);
};

// Delete quote
window.deleteQuote = function(index) {
  openModal("Delete Quote", "Are you sure you want to delete this saved quote?", () => {
    savedQuotes.splice(index, 1);
    localStorage.setItem("savedQuotes", JSON.stringify(savedQuotes));
    renderSavedQuotes();
  });
};

// Export CSV
exportBtn.addEventListener("click", () => {
  if (savedQuotes.length === 0) {
    alert("No saved quotes to export");
    return;
  }
  let csv = "Project,Diameter,Quantity,Weight per Bar,Total Weight,Price per Kg,Total Price\n";
  savedQuotes.forEach(q => {
    q.items.forEach(i => {
      csv += `${q.name},${i.dia},${i.qty},${i.weightPerBar.toFixed(2)},${i.totalWeight.toFixed(2)},${i.pricePerKg},${i.totalPrice.toFixed(2)}\n`;
    });
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.csv";
  a.click();
});

// Init
init();
