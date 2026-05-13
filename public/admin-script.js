document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('adminToken');
  if (!token) { window.location.href = '/admin-login.html'; return; }

  const API = (path, opts = {}) => {
    opts.headers = { ...opts.headers, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    return fetch(path, opts).then(async r => {
      if (r.status === 401) { localStorage.clear(); window.location.href = '/admin-login.html'; return; }
      const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Request failed'); return d;
    });
  };

  document.getElementById('adminName').textContent = localStorage.getItem('adminUser') || 'Admin';
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin-login.html';
  });

  // Tab switching
  document.querySelectorAll('.admin-tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById(t.dataset.target).classList.add('active');
    if (t.dataset.target === 'documentsPanel') loadDocuments();
  }));

  // ─── TICKETS ───
  const ticketsList = document.getElementById('ticketsList');
  let allTickets = [];

  async function loadTickets() {
    ticketsList.innerHTML = '<div class="loading-state"><span class="spinner"></span> Loading...</div>';
    try {
      allTickets = await API('/api/admin/tickets');
      renderTickets();
    } catch (e) { ticketsList.innerHTML = `<div class="empty-state">Error: ${esc(e.message)}</div>`; }
  }

  function renderTickets() {
    if (!allTickets.length) { ticketsList.innerHTML = '<div class="empty-state">No tickets found.</div>'; return; }
    ticketsList.innerHTML = allTickets.map(t => `
      <div class="item-card" data-id="${t._id}">
        <div class="item-top">
          <span class="item-title">${esc(t.question)}</span>
          <span class="badge badge-${t.status.toLowerCase()}">${t.status}</span>
        </div>
        <div class="item-meta">
          <span>Confidence: ${Math.round((t.confidence||0)*100)}%</span>
          <span>${new Date(t.createdAt).toLocaleString()}</span>
          ${t.adminReply ? '<span style="color:#22c55e">✓ Replied</span>' : ''}
        </div>
        <div class="item-actions">
          <button class="btn-edit btn-reply" data-id="${t._id}">Reply</button>
          <button class="btn-resolve-inline" data-id="${t._id}" ${t.status==='Resolved'?'disabled':''}>Resolve</button>
          <button class="btn-danger btn-del" data-id="${t._id}">Delete</button>
        </div>
      </div>`).join('');
    bindTicketActions();
  }

  function bindTicketActions() {
    ticketsList.querySelectorAll('.btn-reply').forEach(b => 
      b.addEventListener('click', e => { e.stopPropagation(); openTicketModal(b.dataset.id); }));
    ticketsList.querySelectorAll('.btn-resolve-inline').forEach(b =>
      b.addEventListener('click', async e => {
        e.stopPropagation();
        try { await API(`/api/admin/tickets/${b.dataset.id}/status`, { method:'PUT', body:JSON.stringify({status:'Resolved'}) }); loadTickets(); } catch(err) { alert(err.message); }
      }));
    ticketsList.querySelectorAll('.btn-del').forEach(b =>
      b.addEventListener('click', async e => {
        e.stopPropagation();
        if (!confirm('Delete this ticket?')) return;
        try { await API(`/api/admin/tickets/${b.dataset.id}`, { method:'DELETE' }); loadTickets(); } catch(err) { alert(err.message); }
      }));
    ticketsList.querySelectorAll('.item-card').forEach(c =>
      c.addEventListener('click', () => openTicketModal(c.dataset.id)));
  }

  // Modal
  const modal = document.getElementById('ticketModal');
  let currentTicketId = null;
  document.getElementById('closeModal').addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

  function openTicketModal(id) {
    const t = allTickets.find(x => x._id === id);
    if (!t) return;
    currentTicketId = id;
    document.getElementById('modalQuestion').textContent = t.question;
    document.getElementById('modalAiAnswer').textContent = t.aiAnswer || 'N/A';
    const conf = document.getElementById('modalConfidence');
    const pct = Math.round((t.confidence||0)*100);
    conf.textContent = pct + '%';
    conf.className = 'badge ' + (pct>=80?'badge-resolved':pct>=50?'badge-pending':'badge-closed');
    document.getElementById('modalStatus').value = t.status;
    document.getElementById('modalDate').textContent = new Date(t.createdAt).toLocaleString();
    document.getElementById('modalReply').value = t.adminReply || '';
    document.getElementById('ticketModalMsg').classList.add('hidden');
    modal.classList.remove('hidden');
  }

  document.getElementById('saveTicketBtn').addEventListener('click', async () => {
    const btn = document.getElementById('saveTicketBtn');
    const msgEl = document.getElementById('ticketModalMsg');
    const reply = document.getElementById('modalReply').value.trim();
    const status = document.getElementById('modalStatus').value;
    btn.disabled = true; btn.textContent = 'Saving...';
    try {
      if (reply) await API(`/api/admin/tickets/${currentTicketId}/reply`, { method:'PUT', body:JSON.stringify({adminReply:reply}) });
      else await API(`/api/admin/tickets/${currentTicketId}/status`, { method:'PUT', body:JSON.stringify({status}) });
      showMsg(msgEl, 'Saved!', 'success');
      await loadTickets();
      setTimeout(() => modal.classList.add('hidden'), 700);
    } catch (e) { showMsg(msgEl, e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Save Changes'; }
  });

  document.getElementById('deleteTicketBtn').addEventListener('click', async () => {
    if (!confirm('Delete this ticket?')) return;
    try { await API(`/api/admin/tickets/${currentTicketId}`, { method:'DELETE' }); await loadTickets(); modal.classList.add('hidden'); } catch(e) { alert(e.message); }
  });

  document.getElementById('refreshTickets').addEventListener('click', loadTickets);

  // ─── DOCUMENTS ───
  const documentsList = document.getElementById('documentsList');
  const docForm = document.getElementById('docFormContainer');

  document.getElementById('showAddDocForm').addEventListener('click', () => {
    document.getElementById('editDocId').value = '';
    document.getElementById('docFormTitle').textContent = 'Add New Document';
    document.getElementById('docTitleInput').value = '';
    document.getElementById('docContentInput').value = '';
    document.getElementById('docFormMsg').classList.add('hidden');
    docForm.classList.remove('hidden');
  });
  document.getElementById('cancelDocBtn').addEventListener('click', () => docForm.classList.add('hidden'));

  async function loadDocuments() {
    documentsList.innerHTML = '<div class="loading-state"><span class="spinner"></span> Loading...</div>';
    try {
      const docs = await API('/api/admin/documents');
      if (!docs.length) { documentsList.innerHTML = '<div class="empty-state">No documents.</div>'; return; }
      documentsList.innerHTML = docs.map(d => `
        <div class="item-card" style="cursor:default">
          <div class="item-top"><span class="item-title">${esc(d.title)}</span><span class="item-meta">${new Date(d.createdAt).toLocaleDateString()}</span></div>
          <p style="font-size:0.85rem;color:var(--text2);margin:0.4rem 0">${esc((d.content||'').substring(0,150))}${d.content&&d.content.length>150?'...':''}</p>
          <div class="item-actions"><button class="btn-edit" onclick="editDoc('${d._id}')">Edit</button><button class="btn-danger" onclick="deleteDoc('${d._id}')">Delete</button></div>
        </div>`).join('');
    } catch (e) { documentsList.innerHTML = `<div class="empty-state">Error: ${esc(e.message)}</div>`; }
  }

  document.getElementById('saveDocBtn').addEventListener('click', async () => {
    const btn = document.getElementById('saveDocBtn');
    const msgEl = document.getElementById('docFormMsg');
    const id = document.getElementById('editDocId').value;
    const title = document.getElementById('docTitleInput').value.trim();
    const content = document.getElementById('docContentInput').value.trim();
    if (!title||!content) { showMsg(msgEl,'Title and content required.','error'); return; }
    btn.disabled = true; btn.textContent = 'Processing...';
    try {
      if (id) await API(`/api/admin/documents/${id}`, { method:'PUT', body:JSON.stringify({title,content}) });
      else await API('/api/admin/documents', { method:'POST', body:JSON.stringify({title,content}) });
      showMsg(msgEl, id?'Updated!':'Created!', 'success');
      await loadDocuments();
      setTimeout(() => docForm.classList.add('hidden'), 800);
    } catch (e) { showMsg(msgEl, e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Save Document'; }
  });

  window.editDoc = async (id) => {
    try {
      const docs = await API('/api/admin/documents');
      const d = docs.find(x => x._id === id);
      if (!d) return;
      document.getElementById('editDocId').value = id;
      document.getElementById('docFormTitle').textContent = 'Edit Document';
      document.getElementById('docTitleInput').value = d.title;
      document.getElementById('docContentInput').value = d.content;
      document.getElementById('docFormMsg').classList.add('hidden');
      docForm.classList.remove('hidden');
      docForm.scrollIntoView({ behavior:'smooth' });
    } catch (e) { alert(e.message); }
  };

  window.deleteDoc = async (id) => {
    if (!confirm('Delete this document?')) return;
    try { await API(`/api/admin/documents/${id}`, { method:'DELETE' }); loadDocuments(); } catch(e) { alert(e.message); }
  };

  function esc(s) { return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function showMsg(el, msg, type) { el.textContent = msg; el.className = `form-msg ${type}`; el.classList.remove('hidden'); }

  loadTickets();
});
