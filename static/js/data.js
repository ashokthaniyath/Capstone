// BlockERP Seed Data — Plain JS (no modules, no imports)
// Loaded via <script> tag before app.js

(function(){
  const randomHex = (n) => {
    const c='0123456789abcdef'; let r='';
    for(let i=0;i<n;i++) r+=c[Math.floor(Math.random()*16)];
    return r;
  };
  const randomDate = (s,e) => {
    const a=new Date(s),b=new Date(e);
    return new Date(a.getTime()+Math.random()*(b.getTime()-a.getTime())).toISOString().split('T')[0];
  };
  const randomInt = (a,b) => Math.floor(Math.random()*(b-a+1))+a;

  const firstNames=['John','William','Robert','Michael','David','James','Richard','Joseph','Thomas','Christopher','Emily','Amanda','Sarah','Jessica','Jennifer','Lisa','Mary','Patricia','Elizabeth','Linda'];
  const lastNames=['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez'];
  const clientNames=firstNames.flatMap(fn=>lastNames.slice(0,5).map(ln=>`${fn} ${ln}`)).slice(0,50);

  const PRODUCTS=[
    {id:1,name:'Enterprise Server Pro',sku:'SKU-FJKU09',category:'Hardware',price:4342,stock:29,reorderLevel:62,status:'Low Stock',lastRestocked:'2026-02-01'},
    {id:2,name:'Cloud Storage Solution',sku:'SKU-B5H1YZ',category:'Accessories',price:7457,stock:388,reorderLevel:50,status:'In Stock',lastRestocked:'2026-01-09'},
    {id:3,name:'Security Suite X',sku:'SKU-6QY7NH',category:'Software',price:1151,stock:390,reorderLevel:100,status:'In Stock',lastRestocked:'2026-01-26'},
    {id:4,name:'Analytics Platform',sku:'SKU-D5F1F3',category:'Hardware',price:4730,stock:481,reorderLevel:100,status:'In Stock',lastRestocked:'2026-01-27'},
    {id:5,name:'Network Router Elite',sku:'SKU-61PS36',category:'Accessories',price:6273,stock:68,reorderLevel:50,status:'In Stock',lastRestocked:'2026-01-01'},
    {id:6,name:'Backup System Pro',sku:'SKU-CIMCDB',category:'Subscriptions',price:552,stock:288,reorderLevel:50,status:'In Stock',lastRestocked:'2026-02-24'},
    {id:7,name:'Database Manager',sku:'SKU-LPLEQ8',category:'Hardware',price:4714,stock:282,reorderLevel:50,status:'In Stock',lastRestocked:'2026-01-23'},
    {id:8,name:'API Gateway',sku:'SKU-A6Y60W',category:'Subscriptions',price:9397,stock:450,reorderLevel:100,status:'In Stock',lastRestocked:'2026-01-11'},
    {id:9,name:'Load Balancer X',sku:'SKU-TUZL5L',category:'Hardware',price:3575,stock:166,reorderLevel:50,status:'In Stock',lastRestocked:'2026-01-05'},
    {id:10,name:'Monitoring Dashboard',sku:'SKU-K073W7',category:'Subscriptions',price:8275,stock:118,reorderLevel:50,status:'In Stock',lastRestocked:'2026-01-22'},
    {id:11,name:'Data Sync Tool',sku:'SKU-RQ5PDY',category:'Services',price:4853,stock:220,reorderLevel:50,status:'In Stock',lastRestocked:'2026-01-23'},
    {id:12,name:'Integration Hub',sku:'SKU-RSMBY4',category:'Software',price:8531,stock:263,reorderLevel:50,status:'In Stock',lastRestocked:'2026-02-10'},
  ];

  const orderStatuses=['Pending','Processing','Shipped','Delivered','Cancelled'];
  const ORDERS=[
    {id:'ORD00001',customer:'David Smith',amount:104149,status:'Shipped',date:'2026-02-12'},
    {id:'ORD00002',customer:'Robert Garcia',amount:18856,status:'Processing',date:'2026-01-17'},
    {id:'ORD00003',customer:'William Davis',amount:141063,status:'Delivered',date:'2026-02-08'},
    {id:'ORD00004',customer:'Amanda Williams',amount:66200,status:'Delivered',date:'2026-01-24'},
    {id:'ORD00005',customer:'Michael Jones',amount:36602,status:'Delivered',date:'2025-12-11'},
    {id:'ORD00006',customer:'Amanda Rodriguez',amount:28600,status:'Delivered',date:'2025-12-21'},
    {id:'ORD00007',customer:'Emily Williams',amount:126159,status:'Shipped',date:'2025-12-25'},
    {id:'ORD00008',customer:'Amanda Rodriguez',amount:107668,status:'Delivered',date:'2025-12-26'},
    ...Array.from({length:92},(_,i)=>({
      id:`ORD${String(i+9).padStart(5,'0')}`,
      customer:clientNames[Math.floor(Math.random()*clientNames.length)],
      amount:randomInt(5000,150000),
      status:orderStatuses[Math.floor(Math.random()*orderStatuses.length)],
      date:randomDate('2025-06-01','2026-02-28')
    }))
  ];

  const invoiceStatuses=['Paid','Overdue','Draft','Sent'];
  const INVOICES=[
    {id:'INV00001',customer:'David Smith',amount:104149,status:'Overdue',issueDate:'2026-02-01',dueDate:'2026-03-03',txHash:`0x${randomHex(64)}`,ipfsCid:`Qm${randomHex(44)}`},
    {id:'INV00002',customer:'Robert Garcia',amount:18856,status:'Overdue',issueDate:'2026-01-16',dueDate:'2026-02-16',txHash:`0x${randomHex(64)}`,ipfsCid:`Qm${randomHex(44)}`},
    {id:'INV00003',customer:'William Davis',amount:141063,status:'Paid',issueDate:'2026-02-11',dueDate:'2026-03-11',txHash:`0x${randomHex(64)}`,ipfsCid:`Qm${randomHex(44)}`},
    {id:'INV00004',customer:'Amanda Williams',amount:66200,status:'Paid',issueDate:'2026-02-28',dueDate:'2026-03-30',txHash:`0x${randomHex(64)}`,ipfsCid:null},
    {id:'INV00005',customer:'Michael Jones',amount:36602,status:'Paid',issueDate:'2026-02-04',dueDate:'2026-03-06',txHash:`0x${randomHex(64)}`,ipfsCid:`Qm${randomHex(44)}`},
    ...Array.from({length:95},(_,i)=>{
      const issueDate=randomDate('2025-10-01','2026-02-28');
      const dueDate=new Date(new Date(issueDate).getTime()+30*86400000).toISOString().split('T')[0];
      const hasTx=Math.random()<.7, hasCid=hasTx&&Math.random()<.6;
      return{id:`INV${String(i+6).padStart(5,'0')}`,customer:clientNames[Math.floor(Math.random()*clientNames.length)],amount:randomInt(5000,150000),status:invoiceStatuses[Math.floor(Math.random()*invoiceStatuses.length)],issueDate,dueDate,txHash:hasTx?`0x${randomHex(64)}`:null,ipfsCid:hasCid?`Qm${randomHex(44)}`:null};
    })
  ];

  const ticketTitles=['Product return','Refund request','Product delivery delay','Account upgrade','Feature request','Password reset','Integration issue','Technical support needed','Unable to access dashboard','Billing inquiry'];
  const ticketStatuses=['open','in-progress','resolved','closed'];
  const ticketPriorities=['LOW','MEDIUM','HIGH','CRITICAL'];
  const ticketAssignees=['Emily Williams','Jessica Brown','Amanda Martinez','John Smith','Robert Johnson','Michael Miller'];
  const TICKETS=Array.from({length:30},(_,i)=>({
    id:`TKT-${String(i+1).padStart(5,'0')}`,title:ticketTitles[i%ticketTitles.length],
    description:`Customer reported an issue regarding ${ticketTitles[i%ticketTitles.length].toLowerCase()}.`,
    status:ticketStatuses[i%ticketStatuses.length],priority:ticketPriorities[Math.floor(Math.random()*ticketPriorities.length)],
    assignee:ticketAssignees[Math.floor(Math.random()*ticketAssignees.length)],
    client:clientNames[Math.floor(Math.random()*clientNames.length)],
    createdAt:randomDate('2026-01-01','2026-03-05'),updatedAt:randomDate('2026-02-01','2026-03-05')
  }));

  const auditUsers=['Sarah Chen','Chris Wilson','Emily Davis','Mike Johnson','Alex Thompson'];
  const auditActions=['Processed payment','Resolved support ticket','Updated order status','Verified blockchain record','Created order','Generated invoice','Exported report','Updated product pricing','Modified user permissions','Updated inventory'];
  const auditEntities=['User','Settings','Order','Invoice','Product','Ticket'];
  const AUDIT_LOG=Array.from({length:100},(_,i)=>{
    const hasHash=Math.random()<.6;
    const action=auditActions[Math.floor(Math.random()*auditActions.length)];
    const entity=auditEntities[Math.floor(Math.random()*auditEntities.length)];
    const user=auditUsers[Math.floor(Math.random()*auditUsers.length)];
    const ts=new Date(Date.now()-i*720000);
    return{id:i+1,user,action,entity,entityId:`${entity.toUpperCase().substring(0,3)}-${String(randomInt(1,999)).padStart(3,'0')}`,hash:hasHash?`0x${randomHex(40)}`:null,timestamp:ts.toISOString(),details:`${action} for ${entity.toLowerCase()} record`};
  });

  const blockchainTypes=['Invoice','Order','Audit','Inventory'];
  const BLOCKCHAIN_TXS=Array.from({length:200},(_,i)=>{
    const type=blockchainTypes[Math.floor(Math.random()*blockchainTypes.length)];
    const ts=new Date(Date.now()-i*180000);
    return{id:i+1,hash:`0x${randomHex(40)}`,type,entityId:`${type.toUpperCase().substring(0,3)}-${String(randomInt(1,999)).padStart(3,'0')}`,status:Math.random()<.95?'Verified':'Pending',timestamp:ts.toISOString(),gasUsed:randomInt(21000,150000)};
  });

  const REVENUE_HISTORY=[
    {month:'Mar',value:42000},{month:'Apr',value:38000},{month:'May',value:45000},{month:'Jun',value:41000},
    {month:'Jul',value:43000},{month:'Aug',value:47000},{month:'Sep',value:52000},{month:'Oct',value:89000},
    {month:'Nov',value:145000},{month:'Dec',value:380000},{month:'Jan',value:1200000},{month:'Feb',value:2541768},
  ];

  const VENDORS=[
    {id:1,name:'ABC Traders',vendorId:'VND-001',trustScore:87,riskLevel:'Low',totalOrders:45,successfulOrders:42,deliveryDelays:3,avgDeliveryDays:4.2,category:'Hardware',email:'abc@traders.com',phone:'+91 98765 43210',lastOrderDate:'2026-03-12'},
    {id:2,name:'TechSupply Co',vendorId:'VND-002',trustScore:72,riskLevel:'Medium',totalOrders:30,successfulOrders:24,deliveryDelays:6,avgDeliveryDays:6.8,category:'Software',email:'info@techsupply.co',phone:'+91 87654 32109',lastOrderDate:'2026-03-08'},
    {id:3,name:'Global Parts Ltd',vendorId:'VND-003',trustScore:95,riskLevel:'Low',totalOrders:60,successfulOrders:59,deliveryDelays:1,avgDeliveryDays:2.8,category:'Accessories',email:'contact@globalparts.com',phone:'+91 76543 21098',lastOrderDate:'2026-03-15'},
    {id:4,name:'Metro Components',vendorId:'VND-004',trustScore:45,riskLevel:'High',totalOrders:20,successfulOrders:12,deliveryDelays:8,avgDeliveryDays:11.5,category:'Hardware',email:'sales@metrocomp.in',phone:'+91 65432 10987',lastOrderDate:'2026-02-20'},
    {id:5,name:'Precision Tools Inc',vendorId:'VND-005',trustScore:63,riskLevel:'Medium',totalOrders:35,successfulOrders:27,deliveryDelays:5,avgDeliveryDays:7.1,category:'Services',email:'orders@precisiontools.com',phone:'+91 54321 09876',lastOrderDate:'2026-03-01'},
  ];

  // Expose globally
  window.DATA={PRODUCTS,ORDERS,INVOICES,TICKETS,AUDIT_LOG,BLOCKCHAIN_TXS,REVENUE_HISTORY,VENDORS,randomHex,randomInt,randomDate,clientNames,auditActions,auditEntities,auditUsers,blockchainTypes};
})();
