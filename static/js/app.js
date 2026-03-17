// BlockERP – Plain HTML/CSS/JS Application
// Requires data.js loaded first

(function(){
'use strict';

// ============ STATE ============
const state = {
  currentPage: 'dashboard',
  theme: localStorage.getItem('erp-theme') || 'light',
  user: { name:'Alex Thompson', role:'admin', initials:'AT', email:'alex@company.com', department:'Operations' },
  searchQuery: '',
  isOnline: navigator.onLine,
  notificationCount: 2,
  orders: [...DATA.ORDERS],
  invoices: [...DATA.INVOICES],
  inventory: [...DATA.PRODUCTS],
  tickets: [...DATA.TICKETS],
  auditLog: [...DATA.AUDIT_LOG],
  blockchainTxs: [...DATA.BLOCKCHAIN_TXS],
  revenueHistory: [...DATA.REVENUE_HISTORY],
  vendors: [...DATA.VENDORS],
  metrics: { totalRevenue:2541768, totalOrders:100, pendingOrders:30 },
  toasts: [],
};

// ============ HELPERS ============
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const h=s=>s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=v=>`₹${v.toLocaleString('en-IN')}`;
const fmtDate=d=>d?new Date(d).toLocaleDateString('en-IN',{year:'numeric',month:'short',day:'numeric'}):'—';
const statusClass=s=>({Pending:'neutral',Processing:'warning',Shipped:'info',Delivered:'success',Cancelled:'danger',Paid:'success',Overdue:'danger',Draft:'neutral',Sent:'info',Verified:'success',open:'info','in-progress':'warning',resolved:'success',closed:'neutral'}[s]||'neutral');

function addToast(msg,type='info'){
  const id=Date.now();
  state.toasts.push({id,message:msg,type});
  renderToasts();
  setTimeout(()=>{state.toasts=state.toasts.filter(t=>t.id!==id);renderToasts()},3500);
}

function renderToasts(){
  let c=$('#toast-container');
  if(!c){c=document.createElement('div');c.id='toast-container';c.className='toast-container';document.body.appendChild(c);}
  c.innerHTML=state.toasts.map(t=>`<div class="toast ${h(t.type)}"><span>${h(t.message)}</span></div>`).join('');
}

// ============ STATS ============
function orderStats(){
  const o=state.orders;
  return{total:o.length,processing:o.filter(x=>x.status==='Processing').length,shipped:o.filter(x=>x.status==='Shipped').length,delivered:o.filter(x=>x.status==='Delivered').length,cancelled:o.filter(x=>x.status==='Cancelled').length,pending:o.filter(x=>x.status==='Pending').length};
}
function invoiceStats(){
  const inv=state.invoices;
  const paid=inv.filter(i=>i.status==='Paid'),od=inv.filter(i=>i.status==='Overdue'),pend=inv.filter(i=>i.status==='Draft'||i.status==='Sent');
  return{total:inv.length,paid:paid.length,paidValue:paid.reduce((s,i)=>s+i.amount,0),overdue:od.length,overdueValue:od.reduce((s,i)=>s+i.amount,0),pending:pend.length,totalValue:inv.reduce((s,i)=>s+i.amount,0)};
}
function inventoryStats(){
  const p=state.inventory;
  return{total:p.length,inStock:p.filter(x=>x.status==='In Stock').length,lowStock:p.filter(x=>x.status==='Low Stock').length,outOfStock:p.filter(x=>x.status==='Out of Stock').length,totalValue:p.reduce((s,x)=>s+x.price*x.stock,0)};
}
function ticketStats(){
  const t=state.tickets;
  return{total:t.length,open:t.filter(x=>x.status==='open').length,inProgress:t.filter(x=>x.status==='in-progress').length,resolved:t.filter(x=>x.status==='resolved').length,closed:t.filter(x=>x.status==='closed').length,critical:t.filter(x=>x.priority==='CRITICAL').length};
}
function blockchainStats(){
  const t=state.blockchainTxs;
  return{total:t.length,verified:t.filter(x=>x.status==='Verified').length,pending:t.filter(x=>x.status==='Pending').length};
}
function auditStats(){
  const l=state.auditLog;const today=new Date().toISOString().split('T')[0];
  return{total:l.length,today:l.filter(x=>x.timestamp.startsWith(today)).length,withHash:l.filter(x=>x.hash).length};
}

// ============ SVG ICONS ============
const icons={
  dashboard:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke-width="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" stroke-width="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" stroke-width="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" stroke-width="1.5"/></svg>',
  orders:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>',
  invoices:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
  inventory:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
  vendors:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
  support:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
  audit:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>',
  blockchain:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>',
  analytics:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>',
  assistant:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>',
  settings:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>',
  search:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>',
  moon:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>',
  sun:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" stroke-width="1.5"/><path stroke-linecap="round" stroke-width="1.5" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.364-7.364l-1.414 1.414M7.05 16.95l-1.414 1.414m0-12.728l1.414 1.414m9.9 9.9l1.414 1.414"/></svg>',
  bell:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>',
  plus:'<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>',
  copy:'<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>',
  check:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
  barcode:'<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 4h2v16H3V4zm4 0h1v16H7V4zm3 0h2v16h-2V4zm4 0h1v16h-1V4zm3 0h2v16h-2V4zm3 0h1v16h-1V4z"/></svg>',
};

const navItems=[
  {id:'dashboard',label:'Dashboard',icon:'dashboard'},
  {id:'orders',label:'Orders',icon:'orders'},
  {id:'invoices',label:'Invoices',icon:'invoices'},
  {id:'inventory',label:'Inventory',icon:'inventory'},
  {id:'vendors',label:'Vendors',icon:'vendors',badge:'Trust'},
  {id:'blockchain',label:'Blockchain',icon:'blockchain'},
  {id:'audit',label:'Audit Log',icon:'audit'},
  {id:'erp-analytics',label:'ERP Analytics',icon:'analytics'},
  {id:'data-assistant',label:'Data Assistant',icon:'assistant',badge:'AI'},
  {id:'support',label:'Support',icon:'support'},
  {id:'settings',label:'Settings',icon:'settings'},
];

// ============ NAVIGATION ============
function navigate(page){
  state.currentPage=page;
  renderSidebar();
  renderPage();
}

// ============ THEME ============
function toggleTheme(){
  state.theme=state.theme==='light'?'dark':'light';
  document.documentElement.setAttribute('data-theme',state.theme);
  localStorage.setItem('erp-theme',state.theme);
  $('#theme-btn').innerHTML=state.theme==='light'?icons.moon:icons.sun;
}

// ============ RENDER SHELL ============
function renderShell(){
  document.documentElement.setAttribute('data-theme',state.theme);
  document.body.innerHTML=`
  <div data-sidebar-layout>
    <!-- Top Nav -->
    <nav data-topnav style="padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--border);background:var(--background);display:flex;align-items:center;justify-content:space-between;gap:var(--space-4)">
      <div style="display:flex;align-items:center;gap:var(--space-3)">
        <div style="display:flex;align-items:center;gap:var(--space-2)">
          ${icons.blockchain}
          <span style="font-weight:var(--font-bold);font-size:var(--text-5)">BlockERP</span>
        </div>
      </div>
      <div style="flex:1;max-width:400px;position:relative">
        <input type="search" id="global-search" placeholder="Search orders, invoices, products..." style="padding-left:var(--space-10)">
        <span style="position:absolute;left:var(--space-3);top:50%;transform:translateY(-50%);color:var(--muted-foreground)">${icons.search}</span>
      </div>
      <div style="display:flex;align-items:center;gap:var(--space-2)">
        <div class="online-pill ${state.isOnline?'online':'offline'}">
          <span class="online-dot"></span>
          <span>${state.isOnline?'Online':'Offline'}</span>
        </div>
        <button class="icon-btn" id="theme-btn" title="Toggle theme">${state.theme==='light'?icons.moon:icons.sun}</button>
        <button class="icon-btn" style="position:relative">${icons.bell}${state.notificationCount>0?'<span class="notification-dot"></span>':''}</button>
        <div style="width:2rem;height:2rem;background:var(--erp-primary);color:white;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:var(--text-8);font-weight:var(--font-medium);cursor:pointer">${h(state.user.initials)}</div>
      </div>
    </nav>
    <!-- Sidebar -->
    <aside data-sidebar>
      <header style="border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:var(--space-2)">
          <div style="width:2.25rem;height:2.25rem;background:var(--erp-primary);color:white;font-size:var(--text-8);display:flex;align-items:center;justify-content:center;border-radius:50%;font-weight:var(--font-medium)">${h(state.user.initials)}</div>
          <div>
            <div style="font-weight:var(--font-medium);font-size:var(--text-7)">${h(state.user.name)}</div>
            <span class="badge" style="font-size:.65rem;text-transform:capitalize;padding:.1rem .4rem">${h(state.user.role)}</span>
          </div>
        </div>
      </header>
      <nav><ul id="sidebar-nav"></ul></nav>
      <footer style="border-top:1px solid var(--border)">
        <div style="font-size:var(--text-8);color:var(--muted-foreground)">BlockERP v1.0 · OAT UI</div>
      </footer>
    </aside>
    <!-- Main -->
    <main id="page-content"></main>
  </div>`;

  // Event listeners
  $('#theme-btn').addEventListener('click',toggleTheme);
  $('#global-search').addEventListener('input',e=>{state.searchQuery=e.target.value;renderPage();});
  window.addEventListener('online',()=>{state.isOnline=true;$('.online-pill').className='online-pill online';$('.online-pill span:last-child').textContent='Online';});
  window.addEventListener('offline',()=>{state.isOnline=false;$('.online-pill').className='online-pill offline';$('.online-pill span:last-child').textContent='Offline';});

  renderSidebar();
  renderPage();
}

function renderSidebar(){
  const nav=$('#sidebar-nav');
  if(!nav) return;
  nav.innerHTML=navItems.map(item=>`
    <li>
      <a href="#" class="${state.currentPage===item.id?'active':''}" data-page="${item.id}">
        ${icons[item.icon]||''}
        <span>${item.label}</span>
        ${item.badge?`<span class="badge" style="margin-left:auto;font-size:.6rem;padding:0 .35rem">${item.badge}</span>`:''}
      </a>
    </li>`).join('');
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigate(a.dataset.page);}));
}

// ============ PAGE ROUTER ============
function renderPage(){
  const m=$('#page-content');
  if(!m) return;
  const pages={dashboard:renderDashboard,orders:renderOrders,invoices:renderInvoices,inventory:renderInventory,vendors:renderVendors,blockchain:renderBlockchain,audit:renderAudit,'erp-analytics':renderAnalytics,'data-assistant':renderAssistant,support:renderSupport,settings:renderSettings};
  const fn=pages[state.currentPage]||renderDashboard;
  fn(m);
}

// ============ DASHBOARD ============
function renderDashboard(el){
  const os=orderStats(), is=invoiceStats(), bs=blockchainStats();
  const svgLine=buildLineChart(state.revenueHistory,200);
  const svgDonut=buildDonutChart([
    {label:'Shipped',value:os.shipped,color:'#8b5cf6'},
    {label:'Processing',value:os.processing,color:'#f59e0b'},
    {label:'Delivered',value:os.delivered,color:'#10b981'},
    {label:'Cancelled',value:os.cancelled,color:'#ef4444'},
    {label:'Pending',value:os.pending,color:'#94a3b8'},
  ]);
  el.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:var(--space-6)">
    <header class="page-header"><h1 class="page-title">Welcome back, ${h(state.user.name.split(' ')[0])}!</h1><p class="page-subtitle">Here's what's happening with your business · ${new Date().toLocaleTimeString()}</p></header>
    <div class="data-grid data-grid-4">
      ${kpiCard('Total Revenue',fmt(state.metrics.totalRevenue),'12.5%','positive','var(--erp-success)')}
      ${kpiCard('Total Orders',state.metrics.totalOrders.toLocaleString(),'8.2%','positive','var(--erp-primary)')}
      ${kpiCard('Pending Orders',state.metrics.pendingOrders.toLocaleString(),'5.1%','positive','var(--erp-warning)')}
      ${kpiCard('Inventory Items','12','2.4%','negative','var(--erp-purple)')}
    </div>
    <div class="data-grid data-grid-2">
      <div class="chart-container"><div class="chart-title">Revenue Over Time</div><p style="font-size:var(--text-8);color:var(--muted-foreground);margin-bottom:var(--space-4)">Last 12 months</p>${svgLine}</div>
      <div class="chart-container"><div class="chart-title">Order Status Distribution</div><p style="font-size:var(--text-8);color:var(--muted-foreground);margin-bottom:var(--space-4)">Current breakdown</p>${svgDonut}</div>
    </div>
    <div class="data-grid data-grid-2">
      <div class="card" style="overflow:hidden;padding:0">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-4);border-bottom:1px solid var(--border)"><h3 style="font-weight:var(--font-semibold);font-size:var(--text-6)">Recent Orders</h3><button class="ghost small" data-nav="orders">View all →</button></div>
        <table><thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead><tbody>
        ${state.orders.slice(0,5).map(o=>`<tr><td style="font-weight:var(--font-medium)">${h(o.id)}</td><td style="color:var(--muted-foreground)">${h(o.customer)}</td><td>${fmt(o.amount)}</td><td><span class="status-badge ${statusClass(o.status)}">${h(o.status)}</span></td></tr>`).join('')}
        </tbody></table>
      </div>
      <div class="card" style="overflow:hidden;padding:0">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-4);border-bottom:1px solid var(--border)"><h3 style="font-weight:var(--font-semibold);font-size:var(--text-6)">Recent Invoices</h3><button class="ghost small" data-nav="invoices">View all →</button></div>
        <table><thead><tr><th>Invoice ID</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead><tbody>
        ${state.invoices.slice(0,5).map(i=>`<tr><td style="font-weight:var(--font-medium)">${h(i.id)}</td><td style="color:var(--muted-foreground)">${h(i.customer)}</td><td>${fmt(i.amount)}</td><td><span class="status-badge ${statusClass(i.status)}">${h(i.status)}</span></td></tr>`).join('')}
        </tbody></table>
      </div>
    </div>
    <div class="data-grid data-grid-4">
      <div class="card" style="padding:var(--space-4)"><p style="font-size:var(--text-7);color:var(--muted-foreground)">Pending Orders</p><p style="font-size:var(--text-2);font-weight:var(--font-bold);margin-top:var(--space-1)">${os.pending}</p></div>
      <div class="card" style="padding:var(--space-4)"><p style="font-size:var(--text-7);color:var(--muted-foreground)">Delivered</p><p style="font-size:var(--text-2);font-weight:var(--font-bold);margin-top:var(--space-1);color:var(--erp-success)">${os.delivered}</p></div>
      <div class="card" style="padding:var(--space-4)"><p style="font-size:var(--text-7);color:var(--muted-foreground)">Paid Invoices</p><p style="font-size:var(--text-2);font-weight:var(--font-bold);margin-top:var(--space-1);color:var(--erp-success)">${is.paid}</p></div>
      <div class="card" style="padding:var(--space-4)"><p style="font-size:var(--text-7);color:var(--muted-foreground)">Verified Txns</p><p style="font-size:var(--text-2);font-weight:var(--font-bold);margin-top:var(--space-1);color:var(--erp-primary)">${bs.verified}</p></div>
    </div>
    <div class="card" style="overflow:hidden;padding:0">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-4);border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:var(--space-2)"><h3 style="font-weight:var(--font-semibold);font-size:var(--text-6)">Blockchain Activity</h3><span class="status-badge success" style="display:flex;align-items:center;gap:var(--space-1)"><span style="width:6px;height:6px;background:currentColor;border-radius:50%;animation:pulse 2s infinite"></span>Live</span></div>
        <button class="ghost small" data-nav="blockchain">View all ${state.blockchainTxs.length} transactions</button>
      </div>
      <div>${state.blockchainTxs.slice(0,6).map(tx=>`
        <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--border)">
          <span style="color:var(--erp-success)">${icons.check}</span>
          <span class="status-badge ${tx.type==='Order'?'info':tx.type==='Invoice'?'warning':'neutral'}">${h(tx.type)}</span>
          <span style="font-size:var(--text-7);color:var(--muted-foreground)">${h(tx.entityId)}</span>
          <code style="font-size:var(--text-8);color:var(--erp-primary);max-width:120px;overflow:hidden;text-overflow:ellipsis">${h(tx.hash.slice(0,12))}...</code>
          <button class="icon-btn" style="width:1.5rem;height:1.5rem" onclick="navigator.clipboard.writeText('${h(tx.hash)}')">${icons.copy}</button>
          <span class="status-badge ${statusClass(tx.status)}">${h(tx.status)}</span>
          <span style="font-size:var(--text-8);color:var(--muted-foreground);margin-left:auto">${new Date(tx.timestamp).toLocaleTimeString()}</span>
        </div>`).join('')}</div>
    </div>
  </div>`;
  el.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.nav)));
}

function kpiCard(label,value,change,dir,accent){
  return`<div class="kpi-card"><div style="display:flex;align-items:flex-start;justify-content:space-between"><div><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-change ${dir}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"${dir==='negative'?' style="transform:rotate(180deg)"':''}><path d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>${change}</div></div><div style="padding:var(--space-2);background:color-mix(in srgb,${accent} 15%,transparent);border-radius:var(--radius-medium);color:${accent}">${icons.dashboard}</div></div></div>`;
}

// ============ CHARTS ============
function buildLineChart(data,height){
  if(!data||!data.length) return '';
  const max=Math.max(...data.map(d=>d.value))*1.1;
  const w=100;
  const pts=data.map((d,i)=>{const x=(i/(data.length-1))*w;const y=height-((d.value/max)*height);return`${x},${y}`;}).join(' ');
  return`<svg viewBox="0 0 ${w} ${height}" style="width:100%;height:${height}px" preserveAspectRatio="none">
    <defs><linearGradient id="lg1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="var(--erp-primary)" stop-opacity=".3"/><stop offset="100%" stop-color="var(--erp-primary)" stop-opacity="0"/></linearGradient></defs>
    <polygon points="0,${height} ${pts} ${w},${height}" fill="url(#lg1)"/>
    <polyline points="${pts}" fill="none" stroke="var(--erp-primary)" stroke-width="2" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

function buildDonutChart(segments){
  const total=segments.reduce((s,x)=>s+x.value,0);
  let angle=-90;
  const paths=segments.map(seg=>{
    const a=(seg.value/total)*360;const s=angle;angle+=a;
    const sr=s*Math.PI/180,er=(s+a)*Math.PI/180;
    const x1=50+40*Math.cos(sr),y1=50+40*Math.sin(sr),x2=50+40*Math.cos(er),y2=50+40*Math.sin(er);
    return`<path d="M 50 50 L ${x1} ${y1} A 40 40 0 ${a>180?1:0} 1 ${x2} ${y2} Z" fill="${seg.color}" opacity=".9"/>`;
  }).join('');
  const legend=segments.map(s=>`<div style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-8)"><span style="width:12px;height:12px;border-radius:var(--radius-small);background:${s.color}"></span><span style="color:var(--muted-foreground)">${s.label}</span><span style="font-weight:var(--font-medium);margin-left:auto">${s.value}</span></div>`).join('');
  return`<div style="display:flex;align-items:center;gap:var(--space-6)"><svg viewBox="0 0 100 100" style="width:160px;height:160px">${paths}<circle cx="50" cy="50" r="25" fill="var(--card)"/></svg><div style="display:flex;flex-direction:column;gap:var(--space-2)">${legend}</div></div>`;
}

// ============ ORDERS ============
function renderOrders(el){
  const os=orderStats();
  const filter=el._filter||'all';
  const search=(el._search||state.searchQuery||'').toLowerCase();
  const page=el._page||1;const pageSize=15;
  const filtered=state.orders.filter(o=>{
    const ms=!search||o.id.toLowerCase().includes(search)||o.customer.toLowerCase().includes(search);
    const mf=filter==='all'||o.status.toLowerCase()===filter;
    return ms&&mf;
  });
  const totalPages=Math.ceil(filtered.length/pageSize);
  const paginated=filtered.slice((page-1)*pageSize,page*pageSize);

  el.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:var(--space-6)">
    <header style="display:flex;align-items:center;justify-content:space-between"><div class="page-header" style="margin-bottom:0"><h1 class="page-title">Orders</h1><p class="page-subtitle">Manage and track all customer orders</p></div></header>
    <div class="data-grid data-grid-5">
      ${['Total Orders|'+os.total,'Pending|'+os.pending,'Processing|'+os.processing,'Shipped|'+os.shipped,'Delivered|'+os.delivered].map(x=>{const[l,v]=x.split('|');return`<div class="kpi-card"><div class="kpi-label">${l}</div><div class="kpi-value">${v}</div></div>`;}).join('')}
    </div>
    <div class="filter-bar">
      <div style="position:relative;flex:1;max-width:300px"><input type="search" id="order-search" placeholder="Search orders..." style="padding-left:var(--space-10)" value="${h(el._search||'')}"><span style="position:absolute;left:var(--space-3);top:50%;transform:translateY(-50%);color:var(--muted-foreground)">${icons.search}</span></div>
      <div class="status-tabs">${['all','pending','processing','shipped','delivered'].map(s=>`<button class="${filter===s?'active':''}" data-filter="${s}">${s}</button>`).join('')}</div>
    </div>
    <div class="card" style="overflow:hidden;padding:0">
      <table><thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${paginated.map(o=>`<tr data-id="${h(o.id)}"><td style="font-weight:var(--font-medium);color:var(--erp-primary)">${h(o.id)}</td><td>${h(o.customer)}</td><td style="color:var(--muted-foreground)">${fmtDate(o.date)}</td><td style="font-weight:var(--font-medium)">${fmt(o.amount)}</td><td><span class="status-badge ${statusClass(o.status)}">${h(o.status)}</span></td><td>${o.status!=='Delivered'&&o.status!=='Cancelled'?`<select class="order-action" data-id="${h(o.id)}" style="font-size:var(--text-8);padding:var(--space-1) var(--space-2);width:auto"><option value="">Update</option>${o.status==='Pending'?'<option value="Processing">Processing</option>':''}${o.status==='Processing'?'<option value="Shipped">Shipped</option>':''}${o.status==='Shipped'?'<option value="Delivered">Delivered</option>':''}<option value="Cancelled">Cancel</option></select>`:''}</td></tr>`).join('')}
      </tbody></table>
      <div style="padding:var(--space-4);border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:var(--text-7);color:var(--muted-foreground)">Showing ${(page-1)*pageSize+1} to ${Math.min(page*pageSize,filtered.length)} of ${filtered.length}</span>
        <div style="display:flex;gap:var(--space-2)"><button class="small" id="order-prev" ${page<=1?'disabled':''}>Previous</button><button class="small" id="order-next" ${page>=totalPages?'disabled':''}>Next</button></div>
      </div>
    </div>
  </div>`;

  // Events
  el.querySelector('#order-search')?.addEventListener('input',e=>{el._search=e.target.value;el._page=1;renderOrders(el);});
  el.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{el._filter=b.dataset.filter;el._page=1;renderOrders(el);}));
  el.querySelector('#order-prev')?.addEventListener('click',()=>{el._page=(el._page||1)-1;renderOrders(el);});
  el.querySelector('#order-next')?.addEventListener('click',()=>{el._page=(el._page||1)+1;renderOrders(el);});
  el.querySelectorAll('.order-action').forEach(sel=>sel.addEventListener('change',e=>{
    if(!e.target.value) return;
    const order=state.orders.find(o=>o.id===e.target.dataset.id);
    if(order){order.status=e.target.value;addToast(`Order ${order.id} updated to ${order.status}`,'success');renderOrders(el);}
  }));
}

// ============ INVOICES ============
function renderInvoices(el){
  const is=invoiceStats();
  const filter=el._filter||'all';
  const search=(el._search||state.searchQuery||'').toLowerCase();
  const page=el._page||1;const pageSize=15;
  const filtered=state.invoices.filter(inv=>{
    const ms=!search||inv.id.toLowerCase().includes(search)||(inv.customer||'').toLowerCase().includes(search);
    let mf=filter==='all';
    if(filter==='paid') mf=inv.status==='Paid';
    if(filter==='overdue') mf=inv.status==='Overdue';
    if(filter==='pending') mf=inv.status==='Draft'||inv.status==='Sent';
    return ms&&mf;
  });
  const totalPages=Math.ceil(filtered.length/pageSize);
  const paginated=filtered.slice((page-1)*pageSize,page*pageSize);

  el.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:var(--space-6)">
    <header class="page-header"><h1 class="page-title">Invoices</h1><p class="page-subtitle">Manage billing and payment tracking</p></header>
    <div class="data-grid data-grid-4">
      <div class="kpi-card"><div class="kpi-label">Total Invoices</div><div class="kpi-value">${is.total}</div></div>
      <div class="kpi-card"><div class="kpi-label">Paid</div><div class="kpi-value" style="color:var(--erp-success)">${is.paid}</div><div style="font-size:var(--text-8);color:var(--muted-foreground)">${fmt(is.paidValue)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Overdue</div><div class="kpi-value" style="color:var(--erp-danger)">${is.overdue}</div><div style="font-size:var(--text-8);color:var(--muted-foreground)">${fmt(is.overdueValue)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Pending</div><div class="kpi-value" style="color:var(--erp-warning)">${is.pending}</div></div>
    </div>
    <div class="filter-bar">
      <div style="position:relative;flex:1;max-width:300px"><input type="search" id="inv-search" placeholder="Search invoices..." style="padding-left:var(--space-10)" value="${h(el._search||'')}"><span style="position:absolute;left:var(--space-3);top:50%;transform:translateY(-50%);color:var(--muted-foreground)">${icons.search}</span></div>
      <div class="status-tabs">${['all','paid','overdue','pending'].map(s=>`<button class="${filter===s?'active':''}" data-filter="${s}">${s}</button>`).join('')}</div>
    </div>
    <div class="card" style="overflow:hidden;padding:0">
      <table><thead><tr><th>Invoice ID</th><th>Customer</th><th>Date</th><th>Due</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${paginated.map(inv=>`<tr class="inv-row" data-id="${h(inv.id)}"><td style="font-weight:var(--font-medium);color:var(--erp-primary)">${h(inv.id)}</td><td>${h(inv.customer||'')}</td><td style="color:var(--muted-foreground)">${fmtDate(inv.issueDate)}</td><td style="color:var(--muted-foreground)">${fmtDate(inv.dueDate)}</td><td style="font-weight:var(--font-medium)">${fmt(inv.amount)}</td><td><span class="status-badge ${statusClass(inv.status)}">${h(inv.status)}</span></td><td>${inv.status!=='Paid'?`<button class="small mark-paid-btn" data-id="${h(inv.id)}">Mark Paid</button>`:''}</td></tr>`).join('')}
      </tbody></table>
      <div style="padding:var(--space-4);border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:var(--text-7);color:var(--muted-foreground)">Showing ${(page-1)*pageSize+1} to ${Math.min(page*pageSize,filtered.length)} of ${filtered.length}</span>
        <div style="display:flex;gap:var(--space-2)"><button class="small" id="inv-prev" ${page<=1?'disabled':''}>Previous</button><button class="small" id="inv-next" ${page>=totalPages?'disabled':''}>Next</button></div>
      </div>
    </div>
  </div>
  <div id="inv-modal"></div>`;

  el.querySelector('#inv-search')?.addEventListener('input',e=>{el._search=e.target.value;el._page=1;renderInvoices(el);});
  el.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{el._filter=b.dataset.filter;el._page=1;renderInvoices(el);}));
  el.querySelector('#inv-prev')?.addEventListener('click',()=>{el._page=(el._page||1)-1;renderInvoices(el);});
  el.querySelector('#inv-next')?.addEventListener('click',()=>{el._page=(el._page||1)+1;renderInvoices(el);});
  el.querySelectorAll('.mark-paid-btn').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation();
    const inv=state.invoices.find(i=>i.id===b.dataset.id);
    if(inv){inv.status='Paid';addToast(`Invoice ${inv.id} marked as Paid`,'success');renderInvoices(el);}
  }));
  el.querySelectorAll('.inv-row').forEach(r=>r.addEventListener('click',()=>{
    const inv=state.invoices.find(i=>i.id===r.dataset.id);
    if(inv) showInvoiceModal(inv,el);
  }));
}

function showInvoiceModal(inv,el){
  const m=el.querySelector('#inv-modal');
  m.innerHTML=`<div class="modal-overlay" id="inv-modal-overlay"><div class="modal-content" onclick="event.stopPropagation()">
    <div class="modal-header"><h2 style="font-size:var(--text-5);font-weight:var(--font-semibold)">Invoice ${h(inv.id)}</h2><button class="icon-btn" id="close-inv-modal">×</button></div>
    <div class="modal-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
        <div><label style="font-size:var(--text-8);color:var(--muted-foreground)">Customer</label><p style="font-weight:var(--font-medium)">${h(inv.customer||'')}</p></div>
        <div><label style="font-size:var(--text-8);color:var(--muted-foreground)">Amount</label><p style="font-weight:var(--font-medium)">${fmt(inv.amount)}</p></div>
        <div><label style="font-size:var(--text-8);color:var(--muted-foreground)">Issue Date</label><p style="font-weight:var(--font-medium)">${fmtDate(inv.issueDate)}</p></div>
        <div><label style="font-size:var(--text-8);color:var(--muted-foreground)">Due Date</label><p style="font-weight:var(--font-medium)">${fmtDate(inv.dueDate)}</p></div>
      </div>
      <div><label style="font-size:var(--text-8);color:var(--muted-foreground)">Status</label><div style="margin-top:var(--space-1)"><span class="status-badge ${statusClass(inv.status)}">${h(inv.status)}</span></div></div>
      ${inv.txHash||inv.ipfsCid?`<div style="padding:var(--space-3);background:var(--muted);border-radius:var(--radius-medium);display:flex;flex-direction:column;gap:var(--space-2)">
        <label style="font-size:var(--text-8);color:var(--muted-foreground);font-weight:var(--font-semibold)">Blockchain & IPFS</label>
        ${inv.txHash?`<div style="display:flex;align-items:center;gap:var(--space-2)"><span style="font-size:var(--text-8);color:var(--muted-foreground);white-space:nowrap">Tx Hash:</span><code style="font-size:var(--text-9);font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1" title="${h(inv.txHash)}">${h(inv.txHash.slice(0,10))}...${h(inv.txHash.slice(-8))}</code><button class="icon-btn" style="font-size:var(--text-8);padding:2px 6px;width:auto;height:auto" onclick="navigator.clipboard.writeText('${h(inv.txHash)}')" title="Copy hash">⎘</button></div>`:''}
        ${inv.ipfsCid?`<div style="display:flex;align-items:center;gap:var(--space-2)"><span style="font-size:var(--text-8);color:var(--muted-foreground);white-space:nowrap">IPFS CID:</span><code style="font-size:var(--text-9);font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1" title="${h(inv.ipfsCid)}">${h(inv.ipfsCid.slice(0,12))}...${h(inv.ipfsCid.slice(-6))}</code><button class="icon-btn" style="font-size:var(--text-8);padding:2px 6px;width:auto;height:auto" onclick="navigator.clipboard.writeText('${h(inv.ipfsCid)}')" title="Copy CID">⎘</button></div>`:''}
      </div>`:''}
    </div>
  </div></div>`;
  m.querySelector('#close-inv-modal').addEventListener('click',()=>m.innerHTML='');
  m.querySelector('#inv-modal-overlay').addEventListener('click',()=>m.innerHTML='');
}

// ============ INVENTORY ============
function renderInventory(el){
  const is=inventoryStats();
  const search=(el._search||'').toLowerCase();
  const catFilter=el._cat||'all';
  const cats=[...new Set(state.inventory.map(p=>p.category))];
  const filtered=state.inventory.filter(p=>{
    const ms=!search||p.name.toLowerCase().includes(search)||p.sku.toLowerCase().includes(search);
    const mc=catFilter==='all'||p.category===catFilter;
    return ms&&mc;
  });
  const lowStock=state.inventory.filter(p=>p.stock<=p.reorderLevel);

  el.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:var(--space-6)">
    <header style="display:flex;align-items:center;justify-content:space-between"><div class="page-header" style="margin-bottom:0"><h1 class="page-title">Inventory</h1><p class="page-subtitle">Track stock levels and product management</p></div></header>
    <div class="data-grid data-grid-4">
      <div class="kpi-card"><div class="kpi-label">Total Products</div><div class="kpi-value">${is.total}</div></div>
      <div class="kpi-card"><div class="kpi-label">In Stock</div><div class="kpi-value" style="color:var(--erp-success)">${is.inStock}</div></div>
      <div class="kpi-card"><div class="kpi-label">Low Stock</div><div class="kpi-value" style="color:var(--erp-warning)">${is.lowStock}</div></div>
      <div class="kpi-card"><div class="kpi-label">Total Value</div><div class="kpi-value">${fmt(is.totalValue)}</div></div>
    </div>
    <div class="filter-bar">
      <div style="position:relative;flex:1;max-width:300px"><input type="search" id="inv-search2" placeholder="Search products or SKU..." style="padding-left:var(--space-10)" value="${h(el._search||'')}"><span style="position:absolute;left:var(--space-3);top:50%;transform:translateY(-50%);color:var(--muted-foreground)">${icons.search}</span></div>
      <select id="cat-filter" style="width:auto;max-width:200px"><option value="all">All Categories</option>${cats.map(c=>`<option value="${h(c)}" ${catFilter===c?'selected':''}>${h(c)}</option>`).join('')}</select>
      <button id="scan-btn">${icons.barcode} Scan Barcode</button>
    </div>
    ${lowStock.length?`<div class="card" style="border-left:4px solid var(--erp-purple)">
      <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3)"><span class="badge" style="background:color-mix(in srgb,var(--erp-purple) 15%,transparent);color:var(--erp-purple)">AI</span><strong>Reorder Suggestions</strong></div>
      ${lowStock.map(p=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid var(--border)"><span>${h(p.name)} — <strong>${p.stock}</strong> left (reorder at ${p.reorderLevel})</span><button class="small restock-btn" data-id="${p.id}">Restock +50</button></div>`).join('')}
    </div>`:''}
    <div class="card" style="overflow:hidden;padding:0">
      <table><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${filtered.map(p=>`<tr><td style="font-weight:var(--font-medium)">${h(p.name)}</td><td><code style="font-size:var(--text-8)">${h(p.sku)}</code></td><td>${h(p.category)}</td><td>${fmt(p.price)}</td><td>
        <div style="display:flex;align-items:center;gap:var(--space-2)">${p.stock}<div class="progress-bar" style="width:60px"><div class="progress-fill" style="width:${Math.min(100,(p.stock/Math.max(p.reorderLevel*2,1))*100)}%;background:${p.stock<=p.reorderLevel?'var(--erp-warning)':'var(--erp-success)'}"></div></div></div>
      </td><td><span class="status-badge ${p.status==='In Stock'?'success':p.status==='Low Stock'?'warning':'danger'}">${h(p.status)}</span></td><td><button class="small restock-btn" data-id="${p.id}">+50</button></td></tr>`).join('')}
      </tbody></table>
    </div>
  </div>
  <div id="scanner-modal"></div>`;

  el.querySelector('#inv-search2')?.addEventListener('input',e=>{el._search=e.target.value;renderInventory(el);});
  el.querySelector('#cat-filter')?.addEventListener('change',e=>{el._cat=e.target.value;renderInventory(el);});
  el.querySelectorAll('.restock-btn').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation();
    const p=state.inventory.find(x=>x.id==b.dataset.id);
    if(p){p.stock+=50;p.status=p.stock>p.reorderLevel?'In Stock':p.stock>0?'Low Stock':'Out of Stock';p.lastRestocked=new Date().toISOString().split('T')[0];addToast(`Restocked ${p.name} +50 units`,'success');renderInventory(el);}
  }));
  el.querySelector('#scan-btn')?.addEventListener('click',()=>showScannerModal(el));
}

function showScannerModal(el){
  const m=el.querySelector('#scanner-modal');
  m.innerHTML=`<div class="modal-overlay"><div class="modal-content" onclick="event.stopPropagation()">
    <div class="modal-header"><h2 style="font-size:var(--text-5);font-weight:var(--font-semibold)">Scan Barcode</h2><button class="icon-btn" id="close-scan">×</button></div>
    <div class="modal-body"><p style="font-size:var(--text-7);color:var(--muted-foreground)">Enter product SKU or name</p><input type="text" id="scan-input" placeholder="e.g. SKU-FJKU09"><button data-variant="primary" id="do-scan" style="margin-top:var(--space-2)">Scan</button></div>
  </div></div>`;
  m.querySelector('#close-scan').addEventListener('click',()=>m.innerHTML='');
  m.querySelector('.modal-overlay').addEventListener('click',e=>{if(e.target===e.currentTarget) m.innerHTML='';});
  const doScan=()=>{
    const v=m.querySelector('#scan-input').value.trim().toLowerCase();
    const p=state.inventory.find(x=>x.sku.toLowerCase()===v||x.name.toLowerCase().includes(v));
    if(p){p.stock=Math.max(0,p.stock-1);p.status=p.stock<=0?'Out of Stock':p.stock<=p.reorderLevel?'Low Stock':'In Stock';addToast(`Scanned ${p.name} — stock now ${p.stock}`,'success');m.innerHTML='';renderInventory(el);}
    else addToast('Product not found','error');
  };
  m.querySelector('#do-scan').addEventListener('click',doScan);
  m.querySelector('#scan-input').addEventListener('keydown',e=>{if(e.key==='Enter') doScan();});
  m.querySelector('#scan-input').focus();
}

// ============ VENDORS ============
function renderVendors(el){
  const search=(el._search||'').toLowerCase();
  const sorted=[...state.vendors].sort((a,b)=>b.trustScore-a.trustScore);
  const filtered=sorted.filter(v=>!search||v.name.toLowerCase().includes(search));
  const avg=Math.round(state.vendors.reduce((s,v)=>s+v.trustScore,0)/state.vendors.length);
  const low=state.vendors.filter(v=>v.trustScore<50).length;
  const high=state.vendors.filter(v=>v.trustScore>=80).length;
  const trustColor=s=>s>=80?'var(--erp-success)':s>=50?'var(--erp-warning)':'var(--erp-danger)';
  const riskBadge=r=>r==='Low'?'success':r==='Medium'?'warning':'danger';
  const medals=['🥇','🥈','🥉'];

  el.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:var(--space-6)">
    <header class="page-header"><h1 class="page-title">Vendors</h1><p class="page-subtitle">Trust scores, risk assessment, and vendor performance</p></header>
    <div class="data-grid data-grid-4">
      <div class="kpi-card"><div class="kpi-label">Total Vendors</div><div class="kpi-value">${state.vendors.length}</div></div>
      <div class="kpi-card"><div class="kpi-label">Avg Trust Score</div><div class="kpi-value" style="color:${trustColor(avg)}">${avg}</div></div>
      <div class="kpi-card"><div class="kpi-label">High Risk</div><div class="kpi-value" style="color:var(--erp-danger)">${low}</div></div>
      <div class="kpi-card"><div class="kpi-label">Trusted (80+)</div><div class="kpi-value" style="color:var(--erp-success)">${high}</div></div>
    </div>
    <div class="data-grid data-grid-2">
      <div class="card" style="overflow:hidden;padding:0">
        <div style="padding:var(--space-4);border-bottom:1px solid var(--border)"><h3 style="font-weight:var(--font-semibold);font-size:var(--text-6)">Vendor List</h3></div>
        <div style="padding:var(--space-3)"><input type="search" id="vendor-search" placeholder="Search vendors..." value="${h(el._search||'')}"></div>
        <table><thead><tr><th>Vendor</th><th>Trust Score</th><th>Risk</th><th>Success Rate</th></tr></thead><tbody>
        ${filtered.map(v=>`<tr class="vendor-row" data-id="${v.id}"><td style="font-weight:var(--font-medium)">${h(v.name)}<div style="font-size:var(--text-8);color:var(--muted-foreground)">${h(v.category)}</div></td><td><div style="display:flex;align-items:center;gap:var(--space-2)">${v.trustScore}<div class="progress-bar" style="width:60px"><div class="progress-fill" style="width:${v.trustScore}%;background:${trustColor(v.trustScore)}"></div></div></div></td><td><span class="status-badge ${riskBadge(v.riskLevel)}">${h(v.riskLevel)}</span></td><td>${Math.round(v.successfulOrders/v.totalOrders*100)}%</td></tr>`).join('')}
        </tbody></table>
      </div>
      <div class="card">
        <h3 style="font-weight:var(--font-semibold);font-size:var(--text-6);margin-bottom:var(--space-4)">Trust Leaderboard</h3>
        <div style="display:flex;flex-direction:column;gap:var(--space-3)">
        ${sorted.slice(0,5).map((v,i)=>`<div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2);border-radius:var(--radius-medium);${i<3?'background:var(--faint)':''}">
          <span style="font-size:1.25rem;width:2rem;text-align:center">${i<3?medals[i]:(i+1)}</span>
          <div style="flex:1"><div style="font-weight:var(--font-medium)">${h(v.name)}</div><div style="font-size:var(--text-8);color:var(--muted-foreground)">${h(v.category)}</div></div>
          <div style="font-weight:var(--font-bold);color:${trustColor(v.trustScore)}">${v.trustScore}</div>
        </div>`).join('')}
        </div>
      </div>
    </div>
  </div>
  <div id="vendor-modal"></div>`;

  el.querySelector('#vendor-search')?.addEventListener('input',e=>{el._search=e.target.value;renderVendors(el);});
  el.querySelectorAll('.vendor-row').forEach(r=>r.addEventListener('click',()=>{
    const v=state.vendors.find(x=>x.id==r.dataset.id);
    if(v) showVendorModal(v,el);
  }));
}

function showVendorModal(v,el){
  const m=el.querySelector('#vendor-modal');
  const tc=s=>s>=80?'var(--erp-success)':s>=50?'var(--erp-warning)':'var(--erp-danger)';
  m.innerHTML=`<div class="modal-overlay"><div class="modal-content" style="max-width:550px" onclick="event.stopPropagation()">
    <div class="modal-header"><h2 style="font-size:var(--text-5);font-weight:var(--font-semibold)">${h(v.name)}</h2><button class="icon-btn" id="close-vendor">×</button></div>
    <div class="modal-body">
      <div style="text-align:center"><div style="font-size:var(--text-1);font-weight:var(--font-bold);color:${tc(v.trustScore)}">${v.trustScore}</div><div style="font-size:var(--text-7);color:var(--muted-foreground)">Trust Score</div><div class="progress-bar" style="margin-top:var(--space-2);height:12px"><div class="progress-fill" style="width:${v.trustScore}%;background:${tc(v.trustScore)}"></div></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
        <div class="card" style="padding:var(--space-3)"><div style="font-size:var(--text-8);color:var(--muted-foreground)">Total Orders</div><div style="font-weight:var(--font-bold)">${v.totalOrders}</div></div>
        <div class="card" style="padding:var(--space-3)"><div style="font-size:var(--text-8);color:var(--muted-foreground)">Successful</div><div style="font-weight:var(--font-bold);color:var(--erp-success)">${v.successfulOrders}</div></div>
        <div class="card" style="padding:var(--space-3)"><div style="font-size:var(--text-8);color:var(--muted-foreground)">Delays</div><div style="font-weight:var(--font-bold);color:var(--erp-warning)">${v.deliveryDelays}</div></div>
        <div class="card" style="padding:var(--space-3)"><div style="font-size:var(--text-8);color:var(--muted-foreground)">Avg Delivery</div><div style="font-weight:var(--font-bold)">${v.avgDeliveryDays} days</div></div>
      </div>
      <div><label style="font-size:var(--text-8);color:var(--muted-foreground)">Contact</label><p style="font-size:var(--text-7)">${h(v.email)} · ${h(v.phone)}</p></div>
    </div>
  </div></div>`;
  m.querySelector('#close-vendor').addEventListener('click',()=>m.innerHTML='');
  m.querySelector('.modal-overlay').addEventListener('click',e=>{if(e.target===e.currentTarget) m.innerHTML='';});
}

// ============ BLOCKCHAIN ============
function renderBlockchain(el){
  const bs=blockchainStats();
  const filter=el._filter||'all';
  const page=el._page||1;const pageSize=20;
  const filtered=state.blockchainTxs.filter(tx=>filter==='all'||tx.type.toLowerCase()===filter);
  const totalPages=Math.ceil(filtered.length/pageSize);
  const paginated=filtered.slice((page-1)*pageSize,page*pageSize);

  el.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:var(--space-6)">
    <header class="page-header"><h1 class="page-title">Blockchain</h1><p class="page-subtitle">Transaction verification and smart contract activity</p></header>
    <div class="data-grid data-grid-3">
      <div class="kpi-card"><div class="kpi-label">Total Transactions</div><div class="kpi-value">${bs.total}</div></div>
      <div class="kpi-card"><div class="kpi-label">Verified</div><div class="kpi-value" style="color:var(--erp-success)">${bs.verified}</div></div>
      <div class="kpi-card"><div class="kpi-label">Pending</div><div class="kpi-value" style="color:var(--erp-warning)">${bs.pending}</div></div>
    </div>
    <div class="filter-bar"><div class="status-tabs">${['all','invoice','order','audit','inventory'].map(s=>`<button class="${filter===s?'active':''}" data-filter="${s}">${s}</button>`).join('')}</div></div>
    <div class="card" style="overflow:hidden;padding:0">
      <table><thead><tr><th>Hash</th><th>Type</th><th>Entity</th><th>Status</th><th>Gas</th><th>Time</th></tr></thead><tbody>
      ${paginated.map(tx=>`<tr><td><code style="font-size:var(--text-8);color:var(--erp-primary)" title="${h(tx.hash)}">${h(tx.hash.slice(0,14))}...</code></td><td><span class="status-badge ${tx.type==='Order'?'info':tx.type==='Invoice'?'warning':'neutral'}">${h(tx.type)}</span></td><td>${h(tx.entityId)}</td><td><span class="status-badge ${statusClass(tx.status)}">${h(tx.status)}</span></td><td style="font-size:var(--text-8)">${tx.gasUsed.toLocaleString()}</td><td style="font-size:var(--text-8);color:var(--muted-foreground)">${new Date(tx.timestamp).toLocaleString()}</td></tr>`).join('')}
      </tbody></table>
      <div style="padding:var(--space-4);border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:var(--text-7);color:var(--muted-foreground)">Page ${page} of ${totalPages}</span>
        <div style="display:flex;gap:var(--space-2)"><button class="small" id="bc-prev" ${page<=1?'disabled':''}>Previous</button><button class="small" id="bc-next" ${page>=totalPages?'disabled':''}>Next</button></div>
      </div>
    </div>
  </div>`;

  el.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{el._filter=b.dataset.filter;el._page=1;renderBlockchain(el);}));
  el.querySelector('#bc-prev')?.addEventListener('click',()=>{el._page=(el._page||1)-1;renderBlockchain(el);});
  el.querySelector('#bc-next')?.addEventListener('click',()=>{el._page=(el._page||1)+1;renderBlockchain(el);});
}

// ============ AUDIT LOG ============
function renderAudit(el){
  const as=auditStats();
  const page=el._page||1;const pageSize=20;
  const totalPages=Math.ceil(state.auditLog.length/pageSize);
  const paginated=state.auditLog.slice((page-1)*pageSize,page*pageSize);

  el.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:var(--space-6)">
    <header class="page-header"><h1 class="page-title">Audit Log</h1><p class="page-subtitle">Immutable record of all system activity</p></header>
    <div class="data-grid data-grid-3">
      <div class="kpi-card"><div class="kpi-label">Total Entries</div><div class="kpi-value">${as.total}</div></div>
      <div class="kpi-card"><div class="kpi-label">Today</div><div class="kpi-value">${as.today}</div></div>
      <div class="kpi-card"><div class="kpi-label">With Hash</div><div class="kpi-value" style="color:var(--erp-success)">${as.withHash}</div></div>
    </div>
    <div class="card" style="overflow:hidden;padding:0">
      <table><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Hash</th></tr></thead><tbody>
      ${paginated.map(log=>`<tr><td style="font-size:var(--text-8);color:var(--muted-foreground)">${new Date(log.timestamp).toLocaleString()}</td><td>${h(log.user)}</td><td>${h(log.action)}</td><td><span class="badge">${h(log.entity)}</span> ${h(log.entityId)}</td><td>${log.hash?`<code style="font-size:var(--text-8)" title="${h(log.hash)}">${h(log.hash.slice(0,10))}...</code> <button class="icon-btn" style="width:1.25rem;height:1.25rem" onclick="navigator.clipboard.writeText('${h(log.hash)}')">${icons.copy}</button>`:'<span style="color:var(--muted-foreground)">—</span>'}</td></tr>`).join('')}
      </tbody></table>
      <div style="padding:var(--space-4);border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:var(--text-7);color:var(--muted-foreground)">Page ${page} of ${totalPages}</span>
        <div style="display:flex;gap:var(--space-2)"><button class="small" id="audit-prev" ${page<=1?'disabled':''}>Previous</button><button class="small" id="audit-next" ${page>=totalPages?'disabled':''}>Next</button></div>
      </div>
    </div>
  </div>`;

  el.querySelector('#audit-prev')?.addEventListener('click',()=>{el._page=(el._page||1)-1;renderAudit(el);});
  el.querySelector('#audit-next')?.addEventListener('click',()=>{el._page=(el._page||1)+1;renderAudit(el);});
}

// ============ ERP ANALYTICS ============
function renderAnalytics(el){
  const os=orderStats(),is=invoiceStats(),invs=inventoryStats();
  const catGroups={};
  state.inventory.forEach(p=>{if(!catGroups[p.category])catGroups[p.category]={count:0,value:0};catGroups[p.category].count++;catGroups[p.category].value+=p.price*p.stock;});
  const barMax=Math.max(...Object.values(catGroups).map(c=>c.value));

  el.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:var(--space-6)">
    <header class="page-header"><h1 class="page-title">ERP Analytics</h1><p class="page-subtitle">Business intelligence and performance metrics</p></header>
    <div class="data-grid data-grid-4">
      <div class="kpi-card"><div class="kpi-label">Total Revenue</div><div class="kpi-value">${fmt(state.metrics.totalRevenue)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Orders</div><div class="kpi-value">${os.total}</div></div>
      <div class="kpi-card"><div class="kpi-label">Invoice Value</div><div class="kpi-value">${fmt(is.totalValue)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Inventory Value</div><div class="kpi-value">${fmt(invs.totalValue)}</div></div>
    </div>
    <div class="data-grid data-grid-2">
      <div class="chart-container">
        <div class="chart-title">Inventory by Category</div>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);margin-top:var(--space-4)">
        ${Object.entries(catGroups).map(([cat,d])=>`<div><div style="display:flex;justify-content:space-between;font-size:var(--text-7);margin-bottom:var(--space-1)"><span>${h(cat)}</span><span style="font-weight:var(--font-medium)">${fmt(d.value)}</span></div><div class="progress-bar" style="height:12px"><div class="progress-fill" style="width:${(d.value/barMax*100)}%;background:var(--erp-primary)"></div></div></div>`).join('')}
        </div>
      </div>
      <div class="chart-container">
        <div class="chart-title">Order Status Breakdown</div>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);margin-top:var(--space-4)">
        ${[['Delivered',os.delivered,'var(--erp-success)'],['Shipped',os.shipped,'var(--erp-purple)'],['Processing',os.processing,'var(--erp-warning)'],['Pending',os.pending,'#94a3b8'],['Cancelled',os.cancelled,'var(--erp-danger)']].map(([l,v,c])=>`<div style="display:flex;align-items:center;gap:var(--space-3)"><span style="width:80px;font-size:var(--text-7)">${l}</span><div class="progress-bar" style="flex:1;height:12px"><div class="progress-fill" style="width:${(v/os.total*100)}%;background:${c}"></div></div><span style="font-size:var(--text-7);font-weight:var(--font-medium);width:30px;text-align:right">${v}</span></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="chart-container"><div class="chart-title">Revenue Trend</div>${buildLineChart(state.revenueHistory,180)}</div>
  </div>`;
}

// ============ DATA ASSISTANT ============
function renderAssistant(el){
  if(!el._messages) el._messages=[{role:'assistant',text:'Hello! I\'m your BlockERP Data Assistant. Ask me about revenue, orders, inventory, or vendor performance.'}];
  
  el.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:var(--space-6)">
    <header class="page-header"><h1 class="page-title">Data Assistant <span class="badge" style="background:color-mix(in srgb,var(--erp-purple) 15%,transparent);color:var(--erp-purple);margin-left:var(--space-2)">AI</span></h1><p class="page-subtitle">Ask questions about your business data</p></header>
    <div class="chat-container">
      <div class="chat-messages" id="chat-msgs">${el._messages.map(m=>`<div class="chat-message ${m.role}">${h(m.text)}</div>`).join('')}</div>
      <div class="chat-input-container">
        <input type="text" id="chat-input" placeholder="Ask about revenue, orders, inventory..." style="flex:1">
        <button data-variant="primary" id="chat-send">Send</button>
      </div>
    </div>
  </div>`;

  const msgs=$('#chat-msgs');
  if(msgs) msgs.scrollTop=msgs.scrollHeight;

  const send=()=>{
    const input=$('#chat-input');
    const q=input.value.trim();
    if(!q) return;
    el._messages.push({role:'user',text:q});
    const reply=processAIQuery(q);
    el._messages.push({role:'assistant',text:reply});
    input.value='';
    renderAssistant(el);
  };
  $('#chat-send')?.addEventListener('click',send);
  $('#chat-input')?.addEventListener('keydown',e=>{if(e.key==='Enter') send();});
}

function processAIQuery(q){
  const ql=q.toLowerCase();
  const os=orderStats(),is=invoiceStats(),invs=inventoryStats();
  if(ql.includes('revenue')) return`Total revenue is ${fmt(state.metrics.totalRevenue)}. Paid invoice value: ${fmt(is.paidValue)}. Revenue has been trending upward over the last 12 months.`;
  if(ql.includes('order')) return`You have ${os.total} total orders: ${os.delivered} delivered, ${os.shipped} shipped, ${os.processing} processing, ${os.pending} pending, and ${os.cancelled} cancelled.`;
  if(ql.includes('invoice')) return`There are ${is.total} invoices. ${is.paid} paid (${fmt(is.paidValue)}), ${is.overdue} overdue (${fmt(is.overdueValue)}), and ${is.pending} pending.`;
  if(ql.includes('inventory')||ql.includes('stock')) return`${invs.total} products in inventory. ${invs.inStock} in stock, ${invs.lowStock} low stock, ${invs.outOfStock} out of stock. Total value: ${fmt(invs.totalValue)}.`;
  if(ql.includes('vendor')) return`${state.vendors.length} vendors. Top: ${state.vendors.sort((a,b)=>b.trustScore-a.trustScore)[0].name} (score: ${state.vendors[0].trustScore}). Average trust score: ${Math.round(state.vendors.reduce((s,v)=>s+v.trustScore,0)/state.vendors.length)}.`;
  if(ql.includes('blockchain')) return`${blockchainStats().total} blockchain transactions. ${blockchainStats().verified} verified, ${blockchainStats().pending} pending. All on Polygon Mumbai testnet.`;
  return`I can help with: revenue trends, order status, invoice tracking, inventory levels, vendor trust scores, and blockchain activity. Try asking "What's the revenue?" or "Show order status".`;
}

// ============ SUPPORT ============
function renderSupport(el){
  const ts=ticketStats();
  const filter=el._filter||'all';
  const filtered=state.tickets.filter(t=>filter==='all'||t.status===filter);

  el.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:var(--space-6)">
    <header style="display:flex;align-items:center;justify-content:space-between"><div class="page-header" style="margin-bottom:0"><h1 class="page-title">Support</h1><p class="page-subtitle">Manage customer support tickets</p></div><button data-variant="primary" id="new-ticket-btn">${icons.plus} New Ticket</button></header>
    <div class="data-grid data-grid-4">
      <div class="kpi-card"><div class="kpi-label">Total Tickets</div><div class="kpi-value">${ts.total}</div></div>
      <div class="kpi-card"><div class="kpi-label">Open</div><div class="kpi-value" style="color:var(--erp-info)">${ts.open}</div></div>
      <div class="kpi-card"><div class="kpi-label">In Progress</div><div class="kpi-value" style="color:var(--erp-warning)">${ts.inProgress}</div></div>
      <div class="kpi-card"><div class="kpi-label">Critical</div><div class="kpi-value" style="color:var(--erp-danger)">${ts.critical}</div></div>
    </div>
    <div class="filter-bar"><div class="status-tabs">${['all','open','in-progress','resolved','closed'].map(s=>`<button class="${filter===s?'active':''}" data-filter="${s}">${s}</button>`).join('')}</div></div>
    <div class="card" style="overflow:hidden;padding:0">
      <table><thead><tr><th>ID</th><th>Title</th><th>Client</th><th>Priority</th><th>Status</th><th>Assignee</th><th>Date</th></tr></thead><tbody>
      ${filtered.map(t=>`<tr><td style="font-weight:var(--font-medium)">${h(t.id)}</td><td>${h(t.title)}</td><td style="color:var(--muted-foreground)">${h(t.client)}</td><td><span class="status-badge ${t.priority==='CRITICAL'?'danger':t.priority==='HIGH'?'warning':t.priority==='MEDIUM'?'info':'neutral'}">${h(t.priority)}</span></td><td><span class="status-badge ${statusClass(t.status)}">${h(t.status)}</span></td><td style="font-size:var(--text-8)">${h(t.assignee)}</td><td style="font-size:var(--text-8);color:var(--muted-foreground)">${fmtDate(t.createdAt)}</td></tr>`).join('')}
      </tbody></table>
    </div>
  </div>`;

  el.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{el._filter=b.dataset.filter;renderSupport(el);}));
  el.querySelector('#new-ticket-btn')?.addEventListener('click',()=>addToast('New ticket form — coming soon','info'));
}

// ============ SETTINGS ============
function renderSettings(el){
  const tab=el._tab||'profile';
  el.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:var(--space-6)">
    <header class="page-header"><h1 class="page-title">Settings</h1><p class="page-subtitle">Manage your account and preferences</p></header>
    <div class="tab-group">${['profile','notifications','appearance','security'].map(t=>`<button class="${tab===t?'active':''}" data-tab="${t}">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join('')}</div>
    <div id="settings-content"></div>
  </div>`;

  const content=el.querySelector('#settings-content');
  if(tab==='profile'){
    content.innerHTML=`<div class="card"><h3 style="font-weight:var(--font-semibold);margin-bottom:var(--space-4)">Profile Information</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
        <div><label style="font-size:var(--text-8);color:var(--muted-foreground)">Full Name</label><input type="text" value="${h(state.user.name)}" id="set-name"></div>
        <div><label style="font-size:var(--text-8);color:var(--muted-foreground)">Email</label><input type="email" value="${h(state.user.email)}" id="set-email"></div>
        <div><label style="font-size:var(--text-8);color:var(--muted-foreground)">Department</label><input type="text" value="${h(state.user.department)}"></div>
        <div><label style="font-size:var(--text-8);color:var(--muted-foreground)">Role</label><select id="set-role" style="width:100%"><option ${state.user.role==='admin'?'selected':''}>admin</option><option ${state.user.role==='manager'?'selected':''}>manager</option><option ${state.user.role==='viewer'?'selected':''}>viewer</option></select></div>
      </div>
      <button data-variant="primary" style="margin-top:var(--space-4)" id="save-profile">Save Changes</button>
    </div>`;
    content.querySelector('#save-profile')?.addEventListener('click',()=>{
      state.user.name=content.querySelector('#set-name').value;
      state.user.email=content.querySelector('#set-email').value;
      state.user.role=content.querySelector('#set-role').value;
      state.user.initials=state.user.name.split(' ').map(w=>w[0]).join('').toUpperCase();
      addToast('Profile updated','success');
      renderShell();
    });
  } else if(tab==='appearance'){
    content.innerHTML=`<div class="card"><h3 style="font-weight:var(--font-semibold);margin-bottom:var(--space-4)">Theme</h3>
      <div style="display:flex;gap:var(--space-3)">
        <button class="${state.theme==='light'?'active':''}" data-variant="${state.theme==='light'?'primary':''}" id="theme-light">${icons.sun} Light</button>
        <button class="${state.theme==='dark'?'active':''}" data-variant="${state.theme==='dark'?'primary':''}" id="theme-dark">${icons.moon} Dark</button>
      </div>
    </div>`;
    content.querySelector('#theme-light')?.addEventListener('click',()=>{state.theme='light';document.documentElement.setAttribute('data-theme','light');localStorage.setItem('erp-theme','light');renderSettings(el);});
    content.querySelector('#theme-dark')?.addEventListener('click',()=>{state.theme='dark';document.documentElement.setAttribute('data-theme','dark');localStorage.setItem('erp-theme','dark');renderSettings(el);});
  } else if(tab==='notifications'){
    content.innerHTML=`<div class="card"><h3 style="font-weight:var(--font-semibold);margin-bottom:var(--space-4)">Notification Preferences</h3>
      <div style="display:flex;flex-direction:column;gap:var(--space-3)">
        ${['Email Notifications','SMS Alerts','Blockchain Events','Low Stock Alerts','Invoice Reminders'].map((n,i)=>`<label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer"><input type="checkbox" ${i!==1?'checked':''} style="width:auto"> ${n}</label>`).join('')}
      </div>
    </div>`;
  } else {
    content.innerHTML=`<div class="card"><h3 style="font-weight:var(--font-semibold);margin-bottom:var(--space-4)">Security</h3><p style="color:var(--muted-foreground)">Two-factor authentication and session management settings will appear here.</p></div>`;
  }

  el.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{el._tab=b.dataset.tab;renderSettings(el);}));
}

// ============ INIT ============
try{
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){try{renderShell();}catch(e){document.body.innerHTML='<pre style="color:red;padding:2rem">RENDER ERROR: '+e.message+'\n'+e.stack+'</pre>';}});}
  else{try{renderShell();}catch(e){document.body.innerHTML='<pre style="color:red;padding:2rem">RENDER ERROR: '+e.message+'\n'+e.stack+'</pre>';}}
}catch(e){document.body.innerHTML='<pre style="color:red;padding:2rem">INIT ERROR: '+e.message+'\n'+e.stack+'</pre>';}

})();
