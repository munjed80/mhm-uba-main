// Sample demo data for extended UBA pages

window.ubaCalendarEvents = [
  { id: 1, date: '2025-11-18', type: 'client', title: 'Call: ACME kickoff', time: '10:00' },
  { id: 2, date: '2025-11-20', type: 'invoice', title: 'Invoice due: INV-2025-042', time: '09:00' },
  { id: 3, date: '2025-11-22', type: 'project', title: 'Milestone: Phase 1 complete', time: '15:00' },
  { id: 4, date: '2025-11-25', type: 'client', title: 'Review: Beta feedback', time: '11:30' }
];

window.ubaLeads = [
  { id: 1, name: 'Umbrella Corp', company: 'Umbrella', value: 12000, status: 'new' },
  { id: 2, name: 'Wayne Enterprises', company: 'Wayne Ent.', value: 8000, status: 'contacted' },
  { id: 3, name: 'Stark Solutions', company: 'Stark', value: 22000, status: 'qualified' },
  { id: 4, name: 'Oscorp', company: 'Oscorp Inc', value: 4000, status: 'lost' }
];

window.ubaExpenses = [
  { id: 1, date: '2025-11-01', category: 'Software', desc: 'Project management tool', amount: 49.99, status: 'paid' },
  { id: 2, date: '2025-11-03', category: 'Travel', desc: 'Client visit', amount: 320.0, status: 'pending' },
  { id: 3, date: '2025-11-12', category: 'Supplies', desc: 'Office supplies', amount: 58.75, status: 'paid' },
  { id: 4, date: '2025-11-14', category: 'Software', desc: 'Analytics service', amount: 99.0, status: 'pending' }
];

window.ubaFiles = [
  { id: 1, name: 'Proposal_ACME.pdf', type: 'PDF', linked: 'Umbrella Corp', updated: '2025-11-02' },
  { id: 2, name: 'Design_mockup.png', type: 'Image', linked: 'Stark Solutions', updated: '2025-11-10' },
  { id: 3, name: 'Invoice_INV-2025-042.pdf', type: 'PDF', linked: 'Wayne Enterprises', updated: '2025-11-20' },
  { id: 4, name: 'Notes_beta.md', type: 'Doc', linked: 'Internal', updated: '2025-11-15' }
];

window.ubaReports = {
  revenue: { thisMonth: 45230, invoices: 27 },
  activeClients: 42,
  projects: { inProgress: 8, completed: 12, stalled: 2 },
  tasks: { todo: 14, inProgress: 6, done: 72 }
};
