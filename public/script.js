document.addEventListener('DOMContentLoaded', () => {
  // ─── Session ID (anonymous user tracking) ───
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : 
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    localStorage.setItem('sessionId', sessionId);
  }

  // ─── Elements ───
  const askBtn = document.getElementById('askBtn');
  const questionInput = document.getElementById('questionInput');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const answerContainer = document.getElementById('answerContainer');
  const answerText = document.getElementById('answerText');
  const confidenceBadge = document.getElementById('confidenceBadge');
  const ticketMessage = document.getElementById('ticketMessage');
  const myTicketsList = document.getElementById('myTicketsList');
  const ticketCountEl = document.getElementById('ticketCount');
  const refreshMyTickets = document.getElementById('refreshMyTickets');
  
  // Theme Toggle Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const moonIcon = document.getElementById('moonIcon');
  const sunIcon = document.getElementById('sunIcon');

  // ─── Theme Toggle (default is dark, matching admin UI) ───
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    moonIcon.classList.remove('hidden');
    sunIcon.classList.add('hidden');
  } else {
    // Dark is default — sun icon shows to indicate "click for light"
    moonIcon.classList.add('hidden');
    sunIcon.classList.remove('hidden');
  }

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'light') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
      moonIcon.classList.add('hidden');
      sunIcon.classList.remove('hidden');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      moonIcon.classList.remove('hidden');
      sunIcon.classList.add('hidden');
    }
  });

  // ─── Tab Switching ───
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(target).classList.add('active');

      // Load tickets when switching to tickets tab
      if (target === 'ticketsTab') {
        loadMyTickets();
      }
    });
  });

  // ─── Ask Question ───
  askBtn.addEventListener('click', async () => {
    const question = questionInput.value.trim();
    if (!question) return;

    loadingIndicator.classList.remove('hidden');
    answerContainer.classList.add('hidden');
    ticketMessage.classList.add('hidden');
    askBtn.disabled = true;

    try {
      const response = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, sessionId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong processing your request');
      }

      answerText.textContent = data.answer;
      
      const confPercent = Math.round(data.confidence * 100);
      confidenceBadge.textContent = `Confidence: ${confPercent}%`;
      confidenceBadge.className = 'badge';
      
      if (data.confidence >= 0.8) {
        confidenceBadge.classList.add('high');
      } else if (data.confidence >= 0.65) {
        confidenceBadge.classList.add('medium');
      } else {
        confidenceBadge.classList.add('low');
      }

      answerContainer.classList.remove('hidden');

      if (data.ticketCreated) {
        ticketMessage.classList.remove('hidden');
        // Refresh ticket count
        loadMyTickets();
      }

    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      loadingIndicator.classList.add('hidden');
      askBtn.disabled = false;
    }
  });

  // ─── My Tickets ───
  async function loadMyTickets() {
    myTicketsList.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading your tickets...</span></div>';
    
    try {
      const response = await fetch(`/api/my-tickets?sessionId=${encodeURIComponent(sessionId)}`);
      const tickets = await response.json();

      if (!response.ok) throw new Error(tickets.error || 'Failed to load tickets');

      // Update ticket count badge
      if (tickets.length > 0) {
        ticketCountEl.textContent = tickets.length;
        ticketCountEl.classList.remove('hidden');
      } else {
        ticketCountEl.classList.add('hidden');
      }

      if (tickets.length === 0) {
        myTicketsList.innerHTML = `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-secondary); margin-bottom: 0.75rem;">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <p>No tickets yet</p>
            <p class="empty-sub">When a question can't be answered confidently, a ticket will be created here.</p>
          </div>`;
        return;
      }

      myTicketsList.innerHTML = tickets.map(t => {
        const date = new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const statusClass = t.status === 'Resolved' ? 'status-resolved' : t.status === 'Closed' ? 'status-closed' : 'status-pending';
        
        return `
          <div class="ticket-item">
            <div class="ticket-header">
              <strong>${escapeHTML(t.question)}</strong>
              <span class="ticket-status ${statusClass}">${t.status}</span>
            </div>
            ${t.aiAnswer ? `
              <div class="ticket-section">
                <span class="ticket-label">AI Answer</span>
                <p class="ticket-text">${escapeHTML(t.aiAnswer)}</p>
              </div>` : ''}
            ${t.adminReply ? `
              <div class="ticket-section admin-reply-section">
                <span class="ticket-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Admin Reply
                </span>
                <p class="ticket-text admin-reply-text">${escapeHTML(t.adminReply)}</p>
              </div>` : `
              <div class="ticket-section">
                <p class="ticket-waiting">Waiting for admin response...</p>
              </div>`}
            <div class="ticket-footer">
              <span class="ticket-date">${date}</span>
              <span class="ticket-confidence">Confidence: ${Math.round((t.confidence || 0) * 100)}%</span>
            </div>
          </div>`;
      }).join('');

    } catch (error) {
      myTicketsList.innerHTML = `<div class="empty-state"><p>Error loading tickets: ${escapeHTML(error.message)}</p></div>`;
    }
  }

  refreshMyTickets.addEventListener('click', loadMyTickets);

  // Load ticket count on page load
  loadMyTickets();

  // ─── Utility ───
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;'
        }[tag] || tag)
    );
  }
});
