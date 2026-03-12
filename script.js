// State Management for Single Shop
let shop = JSON.parse(localStorage.getItem('eb_single_shop')) || null;
let bills = JSON.parse(localStorage.getItem('eb_shop_bills')) || [];

const FIXED_CHARGE = 50;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    renderHistory();
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });
    checkShopStatus();
});

function checkShopStatus() {
    const warning = document.getElementById('reading-setup-warning');
    const form = document.getElementById('reading-form');
    if (!shop) {
        if (warning) warning.style.display = 'block';
        if (form) {
            form.style.opacity = '0.5';
            form.style.pointerEvents = 'none';
        }
        document.getElementById('display-shop-name-val').innerText = "Not Registered";
        document.getElementById('display-prev-reading').innerText = "0";
    } else {
        if (warning) warning.style.display = 'none';
        if (form) {
            form.style.opacity = '1';
            form.style.pointerEvents = 'auto';
        }
        document.getElementById('display-shop-name-val').innerText = shop.name;
        document.getElementById('display-prev-reading').innerText = shop.lastReading;
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active');
    
    // Add active class to nav
    const navItems = {
        'dashboard': 'nav-dashboard',
        'shop-registration': 'nav-setup',
        'meter-reading': 'nav-reading',
        'bill-history': 'nav-history'
    };
    document.getElementById(navItems[sectionId]).classList.add('active');
    
    const titles = {
        'dashboard': 'Dashboard',
        'shop-registration': 'Shop Setup',
        'meter-reading': 'Meter Entry',
        'bill-history': 'History'
    };
    document.getElementById('page-title').innerText = titles[sectionId];
    
    if (sectionId === 'meter-reading') checkShopStatus();
}

// Shop Registration
document.getElementById('shop-form').addEventListener('submit', (e) => {
    e.preventDefault();
    shop = {
        name: document.getElementById('s-name').value,
        owner: document.getElementById('s-owner').value,
        phone: document.getElementById('s-phone').value,
        meter: document.getElementById('s-meter').value,
        lastReading: parseFloat(document.getElementById('s-initial').value) || 0,
        address: document.getElementById('s-address').value
    };
    
    localStorage.setItem('eb_single_shop', JSON.stringify(shop));
    
    // Toast-like notification
    alert('✅ Shop configuration saved successfully!');
    updateDashboard();
    showSection('dashboard');
});

// Bill Generation
document.getElementById('reading-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!shop) return;
    
    const current = parseFloat(document.getElementById('r-new').value);
    const previous = shop.lastReading;
    
    if (current < previous) {
        alert(`❌ New reading (${current}) cannot be less than previous (${previous})!`);
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
        date: new Date().toISOString().split('T')[0],
        prev: previous,
        curr: current,
        units: units,
        amount: amount,
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
    };
    
    shop.lastReading = current;
    localStorage.setItem('eb_single_shop', JSON.stringify(shop));
    
    bills.push(newBill);
    localStorage.setItem('eb_shop_bills', JSON.stringify(bills));
    
    displayBill(newBill);
    updateDashboard();
    renderHistory();
    
    // Scroll to result
    document.getElementById('bill-result').scrollIntoView({ behavior: 'smooth' });
});

function displayBill(bill) {
    const resultDiv = document.getElementById('bill-result');
    const content = document.getElementById('bill-content');
    resultDiv.style.display = 'block';
    
    content.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin-top: 1rem;">
            <div>
                <p style="color: var(--text-dim); margin-bottom: 5px;">Entity</p>
                <p style="font-size: 1.1rem; font-weight: 500;">${shop.name}</p>
                <p style="font-size: 0.9rem; color: var(--text-dim);">${shop.meter}</p>
            </div>
            <div>
                <p style="color: var(--text-dim); margin-bottom: 5px;">Consumption</p>
                <p style="font-size: 1.1rem; font-weight: 500;">${bill.units.toFixed(2)} kWh</p>
                <p style="font-size: 0.8rem;">(${bill.prev} → ${bill.curr})</p>
            </div>
            <div>
                <p style="color: var(--text-dim); margin-bottom: 5px;">Calculated Total</p>
                <p style="font-size: 1.8rem; font-weight: 700; color: var(--success);">₹${bill.amount.toFixed(2)}</p>
                <p style="font-size: 0.8rem; color: #f59e0b;">Due: ${bill.dueDate}</p>
            </div>
        </div>
        <div style="margin-top: 2rem; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 12px; font-size: 0.85rem; color: var(--text-dim);">
            Slab Breakdown: 0-100 @₹2, 101-300 @₹4, 300+ @₹6. Includes ₹50.00 fixed charges.
        </div>
    `;
}

function updateDashboard() {
    if (!shop) return;
    
    document.getElementById('stat-shop-name').innerText = shop.name;
    document.getElementById('stat-meter-reading').innerText = shop.lastReading + ' kWh';
    
    if (bills.length > 0) {
        const lastBill = bills[bills.length - 1];
        document.getElementById('stat-last-bill').innerText = '₹' + lastBill.amount.toFixed(2);
        document.getElementById('summary-text').innerText = `Last generation successful. System detected ${lastBill.units.toFixed(1)} units consumed from ${lastBill.prev} to ${lastBill.curr}.`;
    }
}

function renderHistory() {
    const tbody = document.getElementById('history-table-body');
    tbody.innerHTML = bills.map(b => `
        <tr>
            <td><div style="font-weight: 600;">${b.date}</div></td>
            <td>${b.prev} - ${b.curr}</td>
            <td><span style="color: var(--accent); font-weight: 600;">${b.units.toFixed(1)}</span></td>
            <td><div style="font-size: 1.1rem; font-weight: 700;">₹${b.amount.toFixed(2)}</div></td>
            <td><span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--success); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem;">Generated</span></td>
        </tr>
    `).reverse().join('');
}

