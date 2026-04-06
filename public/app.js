const EL = {
    chatFlow: document.getElementById('chatFlow'),
    chatInput: document.getElementById('chatInput'),
    btnSend: document.getElementById('btnSend'),
    btnStart: document.getElementById('btnStart'),
    btnHR: document.getElementById('btnHR'),
    btnEnd: document.getElementById('btnEnd'),
    btnRecommend: document.getElementById('btnRecommend'),
    candidateName: document.getElementById('candidateName'),
    candidateRole: document.getElementById('candidateRole'),
    sessionIdDisplay: document.getElementById('sessionIdDisplay'),
    statusText: document.getElementById('statusText'),
    modal: document.getElementById('resultModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    closeBtn: document.querySelector('.close-btn')
};

let currentSessionId = null;

// Unique ID Generator
function generateId() {
    return 'sess_' + Math.random().toString(36).substring(2, 9);
}

// Helpers
function setStatus(text, isError = false) {
    EL.statusText.textContent = text;
    EL.statusText.style.color = isError ? 'var(--error)' : 'var(--text-muted)';
}

function appendMessage(sender, text) {
    const wrapper = document.createElement('div');
    wrapper.className = `message ${sender}-msg`;
    wrapper.innerHTML = `<div class="msg-content"></div>`;
    // using textContent prevents XSS and renders raw string
    wrapper.querySelector('.msg-content').textContent = text;
    EL.chatFlow.appendChild(wrapper);
    EL.chatFlow.scrollTop = EL.chatFlow.scrollHeight;
}

function appendSystemMessage(htmlText) {
    const wrapper = document.createElement('div');
    wrapper.className = `message system-msg`;
    wrapper.innerHTML = `<div class="msg-content">${htmlText}</div>`;
    EL.chatFlow.appendChild(wrapper);
    EL.chatFlow.scrollTop = EL.chatFlow.scrollHeight;
}

function showLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loadingMsg';
    wrapper.className = 'message ai-msg';
    wrapper.innerHTML = `
        <div class="msg-content typing-indicator">
            <span></span><span></span><span></span>
        </div>
    `;
    EL.chatFlow.appendChild(wrapper);
    EL.chatFlow.scrollTop = EL.chatFlow.scrollHeight;
}

function removeLoading() {
    const loader = document.getElementById('loadingMsg');
    if (loader) loader.remove();
}

function showModal(title, jsonPayload) {
    EL.modalTitle.textContent = title;
    EL.modalBody.textContent = typeof jsonPayload === 'string' ? jsonPayload : JSON.stringify(jsonPayload, null, 2);
    EL.modal.style.display = "flex";
}

EL.closeBtn.onclick = () => EL.modal.style.display = "none";
window.onclick = (e) => { if (e.target === EL.modal) EL.modal.style.display = "none"; };

/* =================================================================
   API CALLS
================================================================= */
const API_BASE = '/api/interview';

async function startInterview() {
    currentSessionId = generateId();
    EL.sessionIdDisplay.textContent = currentSessionId;
    
    const candidate = {
        name: EL.candidateName.value,
        role: EL.candidateRole.value
    };

    EL.btnStart.disabled = true;
    EL.candidateName.disabled = true;
    EL.candidateRole.disabled = true;
    setStatus("Initializing Swarm...");
    showLoading();

    try {
        const res = await fetch(`${API_BASE}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: currentSessionId, candidate })
        });
        const data = await res.json();
        removeLoading();
        
        if (data.question) {
            appendSystemMessage("<em>Technical Agent Initialized</em>");
            appendMessage('ai', data.question);
            EL.chatInput.disabled = false;
            EL.btnSend.disabled = false;
            EL.btnHR.disabled = false;
            EL.btnEnd.disabled = false;
            EL.btnRecommend.disabled = false;
            EL.btnStart.style.display = "none";
            setStatus("Waiting for candidate input...");
        } else {
            throw new Error(data.error || "Unknown Error");
        }
    } catch (err) {
        removeLoading();
        setStatus("Failed to start", true);
        EL.btnStart.disabled = false;
    }
}

async function sendAnswer() {
    const text = EL.chatInput.value.trim();
    if (!text || !currentSessionId) return;

    EL.chatInput.value = "";
    EL.chatInput.disabled = true;
    EL.btnSend.disabled = true;

    appendMessage('user', text);
    setStatus("Insight Agent analyzing... Technical Agent typing...");
    showLoading();

    try {
        const res = await fetch(`${API_BASE}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: currentSessionId, answer: text })
        });
        const data = await res.json();
        removeLoading();

        if (data.question) {
            appendMessage('ai', data.question);
        } else {
            appendSystemMessage("Error retrieving response.");
        }
    } catch (err) {
        removeLoading();
        appendSystemMessage("Network error during transmission.");
    } finally {
        EL.chatInput.disabled = false;
        EL.btnSend.disabled = false;
        EL.chatInput.focus();
        setStatus("Waiting for candidate input...");
    }
}

async function triggerHR() {
    if (!currentSessionId) return;
    EL.btnHR.disabled = true;
    appendSystemMessage("<em>Switching Context... Handing off to HR Agent</em>");
    setStatus("HR Agent preparing...");
    showLoading();

    try {
        const res = await fetch(`${API_BASE}/hr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: currentSessionId })
        });
        const data = await res.json();
        removeLoading();
        if (data.question) appendMessage('ai', data.question);
    } catch (err) {
        removeLoading();
        appendSystemMessage("Error reaching HR Agent.");
    } finally {
        EL.btnHR.disabled = false;
        setStatus("Waiting for candidate input...");
    }
}

async function triggerEnd() {
    if (!currentSessionId) return;
    setStatus("Evaluator & Critic Agents compiling final report...");
    showLoading();

    try {
        const res = await fetch(`${API_BASE}/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: currentSessionId })
        });
        const data = await res.json();
        removeLoading();
        showModal("Final Interview Verdict", data);
        appendSystemMessage("<strong>Interview Concluded. See results popup!</strong>");
        EL.chatInput.disabled = true;
        EL.btnSend.disabled = true;
        setStatus("Session Ended.");
    } catch (err) {
        removeLoading();
        setStatus("Evaluation Errored", true);
    }
}

async function triggerRecommendations() {
    if (!currentSessionId) return;
    setStatus("Recommendation Agent fetching MCP Resources...");
    showLoading();

    try {
        const res = await fetch(`${API_BASE}/recommendations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: currentSessionId })
        });
        const data = await res.json();
        removeLoading();
        showModal("AI Generated Skill Roadmap", data);
    } catch (err) {
        removeLoading();
        setStatus("Roadmap Errored", true);
    }
}

/* =================================================================
   EVENT LISTENERS
================================================================= */
EL.btnStart.addEventListener('click', startInterview);
EL.btnSend.addEventListener('click', sendAnswer);
EL.btnHR.addEventListener('click', triggerHR);
EL.btnEnd.addEventListener('click', triggerEnd);
EL.btnRecommend.addEventListener('click', triggerRecommendations);

EL.chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAnswer();
    }
});
