// State Management for Multiple Shops
let shops = JSON.parse(localStorage.getItem('eb_multi_shops')) || [
    { id: "101", name: "Grocery Fresh", owner: "Rajesh K.", phone: "9876543210", meter: "MT-101", address: "Block A", lastReading: 1200 },
    { id: "102", name: "Dairy Delight", owner: "Anita S.", phone: "9876543211", meter: "MT-102", address: "Block B", lastReading: 850 }
];
let bills = JSON.parse(localStorage.getItem('eb_shop_bills_history')) || [];

const FIXED_CHARGE = 50;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    renderHistory();
    renderRegistry();
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });
});

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active');
    
    // UI IDs for nav
    const navMap = {
        'dashboard': 'nav-dashboard',
        'shop-registration': 'nav-setup',
        'shop-registry': 'nav-registry',
        'meter-reading': 'nav-reading',
        'bill-history': 'nav-history'
    };
    if (navMap[sectionId]) document.getElementById(navMap[sectionId]).classList.add('active');
    
    const titles = {
        'dashboard': 'Dashboard',
        'shop-registration': 'Add New Shop',
        'shop-registry': 'Shop Registry',
        'meter-reading': 'Meter Entry',
        'bill-history': 'History'
    };
    document.getElementById('page-title').innerText = titles[sectionId];
    
    if (sectionId === 'shop-registry') renderRegistry();
}

// Shop Registration
document.getElementById('shop-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const sid = document.getElementById('s-id').value;
    
    if (shops.some(s => s.id === sid)) {
        alert('❌ Error: Shop ID already exists!');
        return;
    }

    const newShop = {
        id: sid,
        name: document.getElementById('s-name').value,
        owner: document.getElementById('s-owner').value,
        phone: document.getElementById('s-phone').value,
        meter: document.getElementById('s-meter').value,
        lastReading: parseFloat(document.getElementById('s-initial').value) || 0,
        address: document.getElementById('s-address').value
    };
    
    shops.push(newShop);
    localStorage.setItem('eb_multi_shops', JSON.stringify(shops));
    
    alert('✅ Shop registered successfully!');
    e.target.reset();
    updateDashboard();
    showSection('shop-registry');
});

// Lookup Shop for entry
function lookupShop() {
    const id = document.getElementById('r-id').value;
    const shop = shops.find(s => s.id === id);
    const infoDiv = document.getElementById('lookup-info');
    
    if (shop) {
        infoDiv.style.display = 'block';
        document.getElementById('display-prev-reading').innerText = shop.lastReading;
        document.getElementById('display-shop-name-val').innerText = shop.name;
    } else {
        infoDiv.style.display = 'none';
    }
}

// Bill Generation
document.getElementById('reading-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('r-id').value;
    const current = parseFloat(document.getElementById('r-new').value);
    
    const shopIndex = shops.findIndex(s => s.id === id);
    if (shopIndex === -1) {
        alert('❌ Error: Shop ID not found!');
        return;
    }
    
    const shop = shops[shopIndex];
    const previous = shop.lastReading;
    
    if (current < previous) {
        alert(`❌ Error: New reading (${current}) cannot be less than previous (${previous})!`);
        return;
    }
    
    const units = current - previous;
    let amount = 0;
    
    // Tariff Logic
    if (units <= 100) amount = units * 2;
    else if (units <= 300) amount = (100 * 2) + ((units - 100) * 4);
    else amount = (100 * 2) + (200 * 4) + ((units - 300) * 6);
    
    amount += FIXED_CHARGE;
    
    const newBill = {
        shopId: id,
        shopName: shop.name,
        date: new Date().toISOString().split('T')[0],
        prev: previous,
        curr: current,
        units: units,
        amount: amount,
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
    };
    
    // Update Shop state
    shops[shopIndex].lastReading = current;
    localStorage.setItem('eb_multi_shops', JSON.stringify(shops));
    
    // Store in history
    bills.push(newBill);
    localStorage.setItem('eb_shop_bills_history', JSON.stringify(bills));
    
    displayBill(newBill, shop);
    updateDashboard();
    renderHistory();
    
    document.getElementById('bill-result').scrollIntoView({ behavior: 'smooth' });
});

function displayBill(bill, shop) {
    const resultDiv = document.getElementById('bill-result');
    const content = document.getElementById('bill-content');
    resultDiv.style.display = 'block';
    
    // Calculate simulated breakdowns like the image
    const demandCharges = 15.00;
    const taxes = bill.amount * 0.05;
    const energyCharges = bill.amount - FIXED_CHARGE - demandCharges - taxes;
    
    content.innerHTML = `
        <div class="invoice-box">
            <div class="invoice-header">
                <div class="company-info">
                    <h1>SUPERMARKET BILLING PRO</h1>
                    <p>${shop.address || 'Central Mall, City Complex'}</p>
                    <p>Contact: ${shop.phone}</p>
                </div>
            </div>

            <div class="invoice-title-row">
                <h2>Electricity Bill</h2>
                <div style="text-align: right; font-size: 11px;">
                    <p>Bill Number: <strong>${Math.floor(Math.random() * 9000000) + 1000000}</strong></p>
                    <p>Due Date: <strong>${bill.dueDate}</strong></p>
                </div>
            </div>

            <div class="meta-grid">
                <div class="meta-item">
                    <div class="meta-label">Account ID</div>
                    <div class="meta-value">${shop.id}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Billing Date</div>
                    <div class="meta-value">${bill.date}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Meter Number</div>
                    <div class="meta-value">${shop.meter}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Shop Name</div>
                    <div class="meta-value">${shop.name}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                <div>
                    <h3 class="section-title">Usage Details</h3>
                    <div class="usage-row"><span>Previous Reading:</span> <span>${bill.prev.toLocaleString()} kWh</span></div>
                    <div class="usage-row"><span>Current Reading:</span> <span>${bill.curr.toLocaleString()} kWh</span></div>
                    <div class="usage-row" style="font-weight: 700; color: #2b6cb0;"><span>Total Usage:</span> <span>${bill.units.toLocaleString()} kWh</span></div>
                    <div class="usage-row"><span>Tiered Slab:</span> <span>${bill.units <= 100 ? 'Tier 1' : (bill.units <= 300 ? 'Tier 2' : 'Tier 3')}</span></div>
                </div>
                <div>
                    <h3 class="section-title">Monthly Usage History</h3>
                    <div class="usage-history">
                        <div class="history-bar" style="height: 40%;" data-month="Aug"></div>
                        <div class="history-bar" style="height: 55%;" data-month="Sep"></div>
                        <div class="history-bar" style="height: 35%;" data-month="Oct"></div>
                        <div class="history-bar" style="height: 70%;" data-month="Nov"></div>
                        <div class="history-bar" style="height: 90%; background: #c05621;" data-month="Dec">
                             <span style="position: absolute; top: -15px; width: 100%; text-align: center; font-size: 9px; font-weight: 700;">${bill.units.toFixed(0)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style="margin-top: 30px;">
                <h3 class="section-title">Summary of Charges</h3>
                <div class="charge-row"><span>Energy Usage Charges:</span> <span>₹${energyCharges.toFixed(2)}</span></div>
                <div class="charge-row"><span>Fixed Monthly Charge:</span> <span>₹${FIXED_CHARGE.toFixed(2)}</span></div>
                <div class="charge-row"><span>Demand / Service Fee:</span> <span>₹${demandCharges.toFixed(2)}</span></div>
                <div class="charge-row"><span>Taxes & Surcharges (5%):</span> <span>₹${taxes.toFixed(2)}</span></div>
                
                <div class="total-bar">
                    <span>Total Amount Due:</span>
                    <span>₹${bill.amount.toFixed(2)}</span>
                </div>
            </div>

            <div style="margin-top: 40px; font-size: 11px; color: #718096; border-top: 1px dashed #cbd5e0; padding-top: 20px;">
                <p><strong>Payment Notice:</strong> Please make payments via Bank Transfer or at the Supermarket Admin Office.</p>
                <p>For questions, contact us at (555) 123-4567 or email billing@supermarket-pro.com</p>
            </div>
        </div>
    `;
}

function updateDashboard() {
    document.getElementById('stat-total-shops').innerText = shops.length;
    let totalUnits = bills.reduce((sum, b) => sum + b.units, 0);
    let totalRevenue = bills.reduce((sum, b) => sum + b.amount, 0);
    
    document.getElementById('stat-total-units').innerText = totalUnits.toFixed(1) + ' kWh';
    document.getElementById('stat-total-revenue').innerText = '₹' + totalRevenue.toLocaleString('en-IN');
    
    // Display the most recent shop name in the dashboard
    const shopNameDisplay = document.getElementById('stat-shop-name');
    if (shopNameDisplay) {
        shopNameDisplay.innerText = shops.length > 0 ? shops[shops.length - 1].name : "No Shops";
    }
}

function renderRegistry() {
    const tbody = document.getElementById('registry-table-body');
    tbody.innerHTML = shops.map(s => `
        <tr>
            <td>${s.id}</td>
            <td><div style="font-weight: 600;">${s.name}</div></td>
            <td>${s.owner}</td>
            <td>${s.meter}</td>
            <td>${s.lastReading} kWh</td>
            <td style="display: flex; gap: 8px;">
                <button class="badge" style="background: rgba(99, 102, 241, 0.1); color: var(--primary);" onclick="prepareEntry('${s.id}')">
                    <i class="fas fa-plus"></i> Generate
                </button>
                <button class="badge" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;" onclick="deleteShop('${s.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function prepareEntry(sid) {
    showSection('meter-reading');
    document.getElementById('r-id').value = sid;
    lookupShop();
    document.getElementById('r-new').focus();
}

function deleteShop(id) {
    if (confirm(`Are you sure you want to delete Shop ID ${id}?`)) {
        shops = shops.filter(s => s.id !== id);
        localStorage.setItem('eb_multi_shops', JSON.stringify(shops));
        renderRegistry();
        updateDashboard();
    }
}

function renderHistory() {
    const tbody = document.getElementById('history-table-body');
    tbody.innerHTML = bills.map((b, index) => `
        <tr>
            <td>${b.date}</td>
            <td><span style="color: var(--primary); font-weight: 600;">${b.shopId}</span></td>
            <td>${b.prev} - ${b.curr}</td>
            <td><span style="color: var(--accent);">${b.units.toFixed(1)}</span></td>
            <td>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-weight: 700;">₹${b.amount.toFixed(2)}</div>
                    <button class="badge" style="background: rgba(139, 92, 246, 0.1); color: var(--accent); margin-left: 10px;" onclick="viewPastBill(${index})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </td>
        </tr>
    `).reverse().join('');
}

function viewPastBill(index) {
    const bill = bills[index];
    const shop = shops.find(s => s.id === bill.shopId) || { name: bill.shopName, meter: "Unknown" };
    showSection('meter-reading');
    displayBill(bill, shop);
    document.getElementById('bill-result').scrollIntoView({ behavior: 'smooth' });
}
