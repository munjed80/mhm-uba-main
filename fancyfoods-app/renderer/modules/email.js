window.emailModule = function (container) {
  const layout = document.createElement('div');
  layout.innerHTML = `
    <div class="module-header">
      <div>
        <h3>Email Writer</h3>
        <p class="text-muted mb-0">Compose and send via Hotmail/Outlook SMTP.</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary" id="saveTemplate">Save Template</button>
        <button class="btn btn-primary" id="sendEmail">Send Email</button>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-md-3">
        <label class="form-label">SMTP User (Hotmail/Outlook)</label>
        <input class="form-control" id="smtpUser" />
      </div>
      <div class="col-md-3">
        <label class="form-label">SMTP Password</label>
        <input type="password" class="form-control" id="smtpPass" />
      </div>
      <div class="col-md-3">
        <label class="form-label">Recipient</label>
        <input class="form-control" id="emailTo" />
      </div>
      <div class="col-md-3">
        <label class="form-label">Templates</label>
        <select class="form-select" id="templateSelect"></select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Subject</label>
        <input class="form-control" id="emailSubject" />
      </div>
      <div class="col-12">
        <label class="form-label">Body</label>
        <textarea class="form-control" id="emailBody" rows="8"></textarea>
      </div>
      <div class="col-12">
        <button class="btn btn-outline-secondary" id="saveLocal">Save Locally</button>
        <span class="text-muted small ms-2">Emails saved in /emails folder</span>
      </div>
    </div>
    <div class="mt-4">
      <h6>Email Templates</h6>
      <table class="table table-sm" id="templateTable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Subject</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  container.appendChild(layout);

  const templateTable = layout.querySelector('#templateTable tbody');
  const templateSelect = layout.querySelector('#templateSelect');

  layout.querySelector('#saveTemplate').addEventListener('click', saveTemplate);
  layout.querySelector('#sendEmail').addEventListener('click', sendEmail);
  layout.querySelector('#saveLocal').addEventListener('click', saveLocalEmail);
  templateTable.addEventListener('click', (e) => {
    if (e.target.dataset.load) loadTemplate(e.target.dataset.load);
    if (e.target.dataset.remove) removeTemplate(e.target.dataset.remove);
  });
  templateSelect.addEventListener('change', () => loadTemplate(templateSelect.value));

  async function loadTemplates() {
    const res = await window.fancyAPI.listTemplates();
    if (!res.success) return alert(res.error);
    templateTable.innerHTML = '';
    templateSelect.innerHTML = '<option value="">Select template</option>';
    res.data.forEach((t) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${t.name}</td>
        <td>${t.subject || ''}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-1" data-load="${t.id}">Load</button>
          <button class="btn btn-sm btn-outline-danger" data-remove="${t.id}">Delete</button>
        </td>
      `;
      templateTable.appendChild(row);

      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      templateSelect.appendChild(opt);
    });
  }

  async function saveTemplate() {
    const payload = {
      id: null,
      name: prompt('Template name'),
      subject: document.querySelector('#emailSubject').value,
      body: document.querySelector('#emailBody').value
    };
    if (!payload.name) return;
    const res = await window.fancyAPI.saveTemplate(payload);
    if (!res.success) return alert(res.error);
    loadTemplates();
  }

  async function loadTemplate(id) {
    if (!id) return;
    const res = await window.fancyAPI.listTemplates();
    const t = res.data.find((row) => row.id == id);
    if (!t) return;
    document.querySelector('#emailSubject').value = t.subject || '';
    document.querySelector('#emailBody').value = t.body || '';
  }

  async function removeTemplate(id) {
    if (!confirm('Delete template?')) return;
    const res = await window.fancyAPI.deleteTemplate(Number(id));
    if (!res.success) return alert(res.error);
    loadTemplates();
  }

  async function sendEmail() {
    const smtp = {
      user: document.querySelector('#smtpUser').value,
      pass: document.querySelector('#smtpPass').value
    };
    const payload = {
      to: document.querySelector('#emailTo').value,
      subject: document.querySelector('#emailSubject').value,
      body: document.querySelector('#emailBody').value,
      smtp
    };
    if (!payload.to || !smtp.user || !smtp.pass) return alert('Recipient and SMTP credentials required');
    const res = await window.fancyAPI.sendEmail(payload);
    alert(res.success ? 'Email sent & saved to /emails' : res.error);
  }

  async function saveLocalEmail() {
    const res = await window.fancyAPI.saveEmailLocal({
      subject: document.querySelector('#emailSubject').value,
      body: document.querySelector('#emailBody').value
    });
    alert(res.success ? 'Saved locally' : res.error);
  }

  async function loadConfig() {
    const res = await window.fancyAPI.getConfig();
    if (res?.data?.smtpUser) document.querySelector('#smtpUser').value = res.data.smtpUser;
  }

  document.querySelector('#smtpUser').addEventListener('blur', saveConfig);
  document.querySelector('#smtpPass').addEventListener('blur', saveConfig);

  async function saveConfig() {
    await window.fancyAPI.setConfig({
      smtpUser: document.querySelector('#smtpUser').value,
      smtpPass: document.querySelector('#smtpPass').value
    });
  }

  loadTemplates();
  loadConfig();
};
