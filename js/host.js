// ============================================================================
// HOST/ADMIN CONSOLE LOGIC
// ============================================================================

let isLoggedIn = false;
let currentRun = null;
let currentRunCode = null;
let unsubscribeRun = null;
let unsubscribeResponses = null;
let manualQuestions = [];
let useSampleQuestions = false;

// Login handler
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginBtn').addEventListener('click', handleLogin);
  document.getElementById('newRunBtn').addEventListener('click', showCreateRunForm);
  document.getElementById('useDefaultBtn').addEventListener('click', () => {
    useSampleQuestions = true;
    document.getElementById('manualQuestionForm').style.display = 'none';
    showToast('Will use 15 sample questions');
  });
  document.getElementById('manualQBtn').addEventListener('click', () => {
    useSampleQuestions = false;
    document.getElementById('manualQuestionForm').style.display = 'block';
    manualQuestions = [];
    document.getElementById('questionsList').innerHTML = '';
  });
  document.getElementById('addQBtn').addEventListener('click', addManualQuestion);
  document.getElementById('createRunSubmitBtn').addEventListener('click', handleCreateRun);
  document.getElementById('cancelCreateBtn').addEventListener('click', () => {
    showScreen('dashboardScreen');
  });
  document.getElementById('revealBtn').addEventListener('click', handleRevealAnswer);
  document.getElementById('nextBtn').addEventListener('click', handleNextQuestion);
  document.getElementById('endBtn').addEventListener('click', handleEndQuiz);
  document.getElementById('manageRunBtn').addEventListener('click', showLiveControl);
  document.getElementById('viewReportBtn').addEventListener('click', showReport);
  document.getElementById('deleteRunBtn').addEventListener('click', handleDeleteRun);
  document.getElementById('backBtn').addEventListener('click', showDashboard);
  document.getElementById('closeReportBtn').addEventListener('click', backToView);
  document.getElementById('backFromReportBtn').addEventListener('click', backToView);
  document.getElementById('exportCSVBtn').addEventListener('click', exportToCSV);
  document.getElementById('exportPDFBtn').addEventListener('click', exportToPDF);
});

// Handle login
async function handleLogin() {
  const pin = document.getElementById('adminPin').value;
  const password = document.getElementById('adminPassword').value;

  if (pin !== ADMIN_PIN || password !== ADMIN_PASSWORD) {
    showToast('Invalid PIN or password');
    return;
  }

  isLoggedIn = true;
  showDashboard();
}

// Show dashboard
async function showDashboard() {
  showScreen('dashboardScreen');
  document.getElementById('createRunPanel').style.display = 'none';
  document.getElementById('liveControlPanel').style.display = 'none';
  document.getElementById('viewRunPanel').style.display = 'none';
  document.getElementById('newRunBtn').style.display = 'inline-block';

  try {
    const snapshot = await db.collection('runs').orderBy('createdAt', 'desc').get();
    let html = '';
    snapshot.forEach((doc) => {
      const run = doc.data();
      const status = run.status || 'lobby';
      html += `<div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 15px; margin-bottom: 10px; cursor: pointer; border: 1px solid #FFBB00;" onclick="selectRun('${doc.id}')">
        <p style="font-weight: 700; color: #fff; margin-bottom: 5px;">${run.name}</p>
        <p style="font-size: 0.85rem; color: #aaa; margin-bottom: 5px;">Code: <span style="color: #FFBB00; font-weight: 700;">${doc.id}</span></p>
        <p style="font-size: 0.85rem; color: #aaa; margin-bottom: 5px;">${run.groups ? run.groups.length : 0} groups • ${run.numQuestions || 0} questions</p>
        <span class="status-badge status-${status}">${status.toUpperCase()}</span>
      </div>`;
    });

    if (snapshot.empty) {
      html = '<p style="color: #888; text-align: center; padding: 20px;">No quiz runs yet. Create one to get started.</p>';
    }

    document.getElementById('runsList').innerHTML = html;
  } catch (error) {
    console.error('Load runs error:', error);
  }
}

// Show create run form
function showCreateRunForm() {
  document.getElementById('createRunPanel').style.display = 'block';
  document.getElementById('newRunBtn').style.display = 'none';
  document.getElementById('viewRunPanel').style.display = 'none';
  document.getElementById('liveControlPanel').style.display = 'none';
  useSampleQuestions = false;
  manualQuestions = [];
  document.getElementById('manualQuestionForm').style.display = 'none';
}

// Add manual question form
function addManualQuestion() {
  const idx = manualQuestions.length;
  manualQuestions.push({ text: '', options: ['', '', '', ''], correctIndex: 0, timeLimit: 30 });

  const html = `<div id="q${idx}" style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #666;">
    <input type="text" placeholder="Question text" value="" maxlength="200" onchange="manualQuestions[${idx}].text = this.value" style="width: 100%; padding: 8px; margin-bottom: 10px; background: rgba(255,255,255,0.1); border: 1px solid #666; border-radius: 4px; color: #fff;">
    <div style="margin-bottom: 10px;">
      <label style="color: #aaa; font-size: 0.85rem; display: block; margin-bottom: 5px;">Options:</label>
      <input type="text" placeholder="Option 1" value="" maxlength="100" onchange="manualQuestions[${idx}].options[0] = this.value" style="width: 100%; padding: 6px; margin-bottom: 5px; background: rgba(255,255,255,0.1); border: 1px solid #666; border-radius: 4px; color: #fff;">
      <input type="text" placeholder="Option 2" value="" maxlength="100" onchange="manualQuestions[${idx}].options[1] = this.value" style="width: 100%; padding: 6px; margin-bottom: 5px; background: rgba(255,255,255,0.1); border: 1px solid #666; border-radius: 4px; color: #fff;">
      <input type="text" placeholder="Option 3" value="" maxlength="100" onchange="manualQuestions[${idx}].options[2] = this.value" style="width: 100%; padding: 6px; margin-bottom: 5px; background: rgba(255,255,255,0.1); border: 1px solid #666; border-radius: 4px; color: #fff;">
      <input type="text" placeholder="Option 4" value="" maxlength="100" onchange="manualQuestions[${idx}].options[3] = this.value" style="width: 100%; padding: 6px; background: rgba(255,255,255,0.1); border: 1px solid #666; border-radius: 4px; color: #fff;">
    </div>
    <div style="display: flex; gap: 10px; align-items: center;">
      <select onchange="manualQuestions[${idx}].correctIndex = parseInt(this.value)" style="flex: 1; padding: 6px; background: rgba(255,255,255,0.1); border: 1px solid #666; border-radius: 4px; color: #fff;">
        <option value="0">Correct: Option 1</option>
        <option value="1">Correct: Option 2</option>
        <option value="2">Correct: Option 3</option>
        <option value="3">Correct: Option 4</option>
      </select>
      <input type="number" placeholder="Time (s)" value="30" min="5" max="120" onchange="manualQuestions[${idx}].timeLimit = parseInt(this.value)" style="width: 100px; padding: 6px; background: rgba(255,255,255,0.1); border: 1px solid #666; border-radius: 4px; color: #fff;">
    </div>
    <button onclick="deleteQuestion(${idx})" style="width: 100%; margin-top: 10px; padding: 8px; background: #E63946; border: none; border-radius: 4px; color: #fff; cursor: pointer; font-weight: 600;">Delete</button>
  </div>`;

  document.getElementById('questionsList').insertAdjacentHTML('beforeend', html);
}

// Delete manual question
function deleteQuestion(idx) {
  manualQuestions.splice(idx, 1);
  document.getElementById(`q${idx}`).remove();
}

// Handle create run
async function handleCreateRun() {
  const runName = document.getElementById('runName').value.trim();
  const groupsStr = document.getElementById('groupList').value.trim();

  if (!runName) {
    showToast('Please enter a run name');
    return;
  }

  const groups = groupsStr.split(',').map(g => g.trim()).filter(g => g);
  if (groups.length < 3 || groups.length > 10) {
    showToast('Please define 3-10 groups');
    return;
  }

  let questions = [];
  if (useSampleQuestions) {
    try {
      const response = await fetch('data/sample-questions.json');
      questions = await response.json();
    } catch (error) {
      showToast('Error loading sample questions');
      return;
    }
  } else {
    if (manualQuestions.length < 3) {
      showToast('Please add at least 3 questions');
      return;
    }
    questions = manualQuestions;
  }

  document.getElementById('createRunSubmitBtn').disabled = true;

  try {
    const runCode = generateRunCode();

    // Create run document
    await db.collection('runs').doc(runCode).set({
      name: runName,
      groups: groups,
      status: 'lobby',
      currentQuestionIndex: -1,
      revealedIndex: -1,
      numQuestions: questions.length,
      createdAt: new Date()
    });

    // Add questions
    for (let i = 0; i < questions.length; i++) {
      await db.collection('runs').doc(runCode).collection('questions').doc(String(i)).set(questions[i]);
      // Initialize question stats
      await db.collection('runs').doc(runCode).collection('questionStats').doc(String(i)).set({
        totalResponses: 0,
        totalCorrect: 0,
        groupStats: {},
        fastestThree: []
      });
    }

    showToast(`Run created! Code: ${runCode}`);
    currentRunCode = runCode;
    currentRun = { name: runName, groups, status: 'lobby', numQuestions: questions.length };
    showDashboard();
  } catch (error) {
    console.error('Create run error:', error);
    showToast('Error creating run');
  }

  document.getElementById('createRunSubmitBtn').disabled = false;
}

// Select run to view
async function selectRun(runCode) {
  try {
    const runRef = db.collection('runs').doc(runCode);
    const runDoc = await runRef.get();

    if (!runDoc.exists) {
      showToast('Run not found');
      return;
    }

    currentRun = runDoc.data();
    currentRunCode = runCode;

    document.getElementById('viewRunName').textContent = currentRun.name;
    document.getElementById('viewRunStatus').innerHTML = `<span class="status-badge status-${currentRun.status}">${(currentRun.status || 'lobby').toUpperCase()}</span>`;

    // Count players
    const playersSnap = await db.collection('runs').doc(runCode).collection('players').get();
    document.getElementById('viewRunPlayers').textContent = `${playersSnap.size} players joined`;
    document.getElementById('viewRunQuestions').textContent = `${currentRun.numQuestions} questions`;

    document.getElementById('createRunPanel').style.display = 'none';
    document.getElementById('liveControlPanel').style.display = 'none';
    document.getElementById('viewRunPanel').style.display = 'block';
    showScreen('dashboardScreen');
  } catch (error) {
    console.error('Select run error:', error);
  }
}

// Show live control panel
async function showLiveControl() {
  document.getElementById('viewRunPanel').style.display = 'none';
  document.getElementById('liveControlPanel').style.display = 'block';

  // Subscribe to run updates
  if (unsubscribeRun) unsubscribeRun();
  unsubscribeRun = db.collection('runs').doc(currentRunCode).onSnapshot((doc) => {
    currentRun = doc.data();
    updateLivePanel();
  });

  updateLivePanel();
}

// Update live control panel
async function updateLivePanel() {
  const qIdx = currentRun.currentQuestionIndex || -1;
  const numQuestions = currentRun.numQuestions || 0;

  document.getElementById('currentQDisplay').textContent = qIdx >= 0 ? `Q${qIdx + 1} / ${numQuestions}` : 'Lobby';

  if (qIdx >= 0) {
    const qRef = db.collection('runs').doc(currentRunCode).collection('questions').doc(String(qIdx));
    const qDoc = await qRef.get();
    if (qDoc.exists) {
      const q = qDoc.data();
      document.getElementById('currentQText').textContent = q.text;
      document.getElementById('correctAnswerDisplay').textContent = `✓ Correct: ${q.options[q.correctIndex]}`;
    }
  } else {
    document.getElementById('currentQText').textContent = 'Waiting to start...';
    document.getElementById('correctAnswerDisplay').textContent = '';
  }

  // Count players
  const playersSnap = await db.collection('runs').doc(currentRunCode).collection('players').get();
  document.getElementById('livePlayerCount').textContent = playersSnap.size;

  // Update leaderboard
  const playersRef = db.collection('runs').doc(currentRunCode).collection('players');
  const topSnap = await playersRef.orderBy('totalScore', 'desc').limit(5).get();
  let html = '';
  topSnap.forEach((doc, idx) => {
    const p = doc.data();
    html += `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #666;">
      <span style="color: #FFBB00; font-weight: 700;">${idx + 1}. ${p.name}</span>
      <span style="color: #06A77D;">${p.totalScore}</span>
    </div>`;
  });
  document.getElementById('leaderboardWidget').innerHTML = html || '<p style="color: #888;">No responses yet</p>';

  // Group progress
  if (currentRun.groups) {
    let groupHtml = '';
    for (const group of currentRun.groups) {
      const groupPlayers = await playersRef.where('group', '==', group).get();
      let correct = 0, total = 0;
      groupPlayers.forEach((doc) => {
        const p = doc.data();
        correct += p.totalCorrect || 0;
        total += p.totalAnswered || 0;
      });
      const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
      groupHtml += `<div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.85rem;">
          <span>${group}</span>
          <span style="color: #FFBB00;">${pct}%</span>
        </div>
        <div style="background: rgba(0,0,0,0.3); border-radius: 4px; height: 6px; overflow: hidden;">
          <div style="background: #06A77D; height: 100%; width: ${pct}%; transition: width 0.3s;"></div>
        </div>
      </div>`;
    }
    document.getElementById('groupProgressWidget').innerHTML = groupHtml;
  }

  // Fastest 3
  if (qIdx >= 0) {
    const statsRef = db.collection('runs').doc(currentRunCode).collection('questionStats').doc(String(qIdx));
    const statsDoc = await statsRef.get();
    if (statsDoc.exists && statsDoc.data().fastestThree && statsDoc.data().fastestThree.length > 0) {
      let fastHtml = '';
      statsDoc.data().fastestThree.forEach((f, idx) => {
        fastHtml += `<div style="padding: 8px 0; border-bottom: 1px solid #666; font-size: 0.9rem;">
          <span style="color: #FFBB00; font-weight: 700;">${idx + 1}. ${f.playerName}</span>
          <span style="color: #aaa; float: right;">${Math.round(f.timeTakenMs / 1000)}s</span>
        </div>`;
      });
      document.getElementById('fastestWidget').innerHTML = fastHtml;
    }
  }
}

// Reveal answer
async function handleRevealAnswer() {
  const qIdx = currentRun.currentQuestionIndex || -1;
  if (qIdx < 0) {
    showToast('No question is active');
    return;
  }

  try {
    const responsesRef = db.collection('runs').doc(currentRunCode).collection('responses');
    const statsRef = db.collection('runs').doc(currentRunCode).collection('questionStats').doc(String(qIdx));

    // Get all responses for this question
    const responsesSnap = await responsesRef.where('qIndex', '==', qIdx).get();
    const responses = [];
    responsesSnap.forEach((doc) => responses.push(doc.data()));

    // Calculate stats
    let totalResponses = responses.length;
    let totalCorrect = responses.filter(r => r.correct).length;
    let groupStats = {};
    let fastestCorrect = responses
      .filter(r => r.correct)
      .sort((a, b) => a.timeTakenMs - b.timeTakenMs)
      .slice(0, 3)
      .map(r => ({
        playerId: r.playerId,
        playerName: r.playerName,
        timeTakenMs: r.timeTakenMs
      }));

    currentRun.groups.forEach((g) => {
      const gResponses = responses.filter(r => r.group === g);
      groupStats[g] = {
        total: gResponses.length,
        correct: gResponses.filter(r => r.correct).length
      };
    });

    // Update stats
    await statsRef.update({
      totalResponses,
      totalCorrect,
      groupStats,
      fastestThree: fastestCorrect
    });

    // Mark as revealed
    await db.collection('runs').doc(currentRunCode).update({ revealedIndex: qIdx });

    showToast('Answer revealed!');
    updateLivePanel();
  } catch (error) {
    console.error('Reveal answer error:', error);
    showToast('Error revealing answer');
  }
}

// Next question
async function handleNextQuestion() {
  const nextIdx = (currentRun.currentQuestionIndex || -1) + 1;
  const numQuestions = currentRun.numQuestions || 0;

  if (nextIdx >= numQuestions) {
    showToast('This is the last question. Click "End Quiz" to finish.');
    return;
  }

  try {
    await db.collection('runs').doc(currentRunCode).update({ currentQuestionIndex: nextIdx });
    showToast('Next question!');
  } catch (error) {
    console.error('Next question error:', error);
  }
}

// End quiz
async function handleEndQuiz() {
  if (!confirm('End this quiz? Players will see final scores.')) return;

  try {
    await db.collection('runs').doc(currentRunCode).update({ status: 'closed' });
    showToast('Quiz ended!');
    showDashboard();
  } catch (error) {
    console.error('End quiz error:', error);
  }
}

// Show report
async function showReport() {
  document.getElementById('reportScreen').style.display = 'flex';
  document.getElementById('dashboardScreen').style.display = 'none';

  try {
    const playersRef = db.collection('runs').doc(currentRunCode).collection('players');
    const responsesRef = db.collection('runs').doc(currentRunCode).collection('responses');
    const questionsRef = db.collection('runs').doc(currentRunCode).collection('questions');

    const playersSnap = await playersRef.get();
    const responsesSnap = await responsesRef.get();
    const questionsSnap = await questionsRef.orderBy(firebase.firestore.FieldPath.documentId()).get();

    const players = [];
    playersSnap.forEach((doc) => {
      players.push({ id: doc.id, ...doc.data() });
    });

    const responses = [];
    responsesSnap.forEach((doc) => {
      responses.push(doc.data());
    });

    const questions = [];
    questionsSnap.forEach((doc) => {
      questions.push(doc.data());
    });

    // Build report HTML
    let html = `<h2 style="color: #FFBB00; margin-bottom: 20px;">${currentRun.name} - Report</h2>`;

    html += `<h3 style="color: #FFBB00; margin-top: 20px; margin-bottom: 10px;">Player Results</h3>`;
    html += `<table class="leaderboard-table" style="width: 100%; margin-bottom: 20px;"><tbody>`;
    html += `<tr style="background: rgba(255,187,0,0.1);"><td><b>Rank</b></td><td><b>Name</b></td><td><b>Group</b></td><td><b>Score</b></td><td><b>Correct</b></td><td><b>Accuracy</b></td></tr>`;

    players.sort((a, b) => b.totalScore - a.totalScore);
    players.forEach((p, idx) => {
      const acc = p.totalAnswered > 0 ? Math.round((p.totalCorrect / p.totalAnswered) * 100) : 0;
      html += `<tr><td>${idx + 1}</td><td>${p.name}</td><td>${p.group}</td><td style="color: #FFBB00; font-weight: 700;">${p.totalScore}</td><td>${p.totalCorrect}/${p.totalAnswered}</td><td>${acc}%</td></tr>`;
    });

    html += `</tbody></table>`;

    html += `<h3 style="color: #FFBB00; margin-top: 20px; margin-bottom: 10px;">Question Difficulty</h3>`;
    html += `<table class="leaderboard-table" style="width: 100%;"><tbody>`;
    html += `<tr style="background: rgba(255,187,0,0.1);"><td><b>Q#</b></td><td><b>Responses</b></td><td><b>Correct</b></td><td><b>Success Rate</b></td></tr>`;

    for (let i = 0; i < questions.length; i++) {
      const qResponses = responses.filter(r => r.qIndex === i);
      const correct = qResponses.filter(r => r.correct).length;
      const rate = qResponses.length > 0 ? Math.round((correct / qResponses.length) * 100) : 0;
      html += `<tr><td>${i + 1}</td><td>${qResponses.length}</td><td>${correct}</td><td style="color: ${rate > 70 ? '#06A77D' : '#E63946'};">${rate}%</td></tr>`;
    }

    html += `</tbody></table>`;

    document.getElementById('reportContent').innerHTML = html;
  } catch (error) {
    console.error('Show report error:', error);
    showToast('Error loading report');
  }
}

// Back to view
function backToView() {
  document.getElementById('reportScreen').style.display = 'none';
  document.getElementById('dashboardScreen').style.display = 'flex';
  showLiveControl();
}

// Export to CSV
async function exportToCSV() {
  try {
    const playersRef = db.collection('runs').doc(currentRunCode).collection('players');
    const responsesRef = db.collection('runs').doc(currentRunCode).collection('responses');

    const playersSnap = await playersRef.get();
    const responsesSnap = await responsesRef.get();

    const players = [];
    playersSnap.forEach((doc) => {
      players.push({ id: doc.id, ...doc.data() });
    });

    const responses = [];
    responsesSnap.forEach((doc) => {
      responses.push(doc.data());
    });

    let csv = 'Player Name,Group,Total Score,Correct,Total Answered,Accuracy\n';
    players.sort((a, b) => b.totalScore - a.totalScore);
    players.forEach((p) => {
      const acc = p.totalAnswered > 0 ? Math.round((p.totalCorrect / p.totalAnswered) * 100) : 0;
      csv += `"${p.name}","${p.group}",${p.totalScore},${p.totalCorrect},${p.totalAnswered},${acc}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentRun.name}-report.csv`;
    a.click();
    showToast('CSV exported!');
  } catch (error) {
    console.error('Export CSV error:', error);
    showToast('Error exporting CSV');
  }
}

// Export to PDF
async function exportToPDF() {
  try {
    const element = document.getElementById('reportContent');
    const opt = {
      margin: 10,
      filename: `${currentRun.name}-report.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
    };
    html2pdf().set(opt).from(element).save();
    showToast('PDF exported!');
  } catch (error) {
    console.error('Export PDF error:', error);
    showToast('Error exporting PDF');
  }
}

// Delete run
async function handleDeleteRun() {
  if (!confirm('Permanently delete this quiz and all responses? This cannot be undone.')) return;

  try {
    const batch = db.batch();

    // Delete players
    const playersSnap = await db.collection('runs').doc(currentRunCode).collection('players').get();
    playersSnap.forEach((doc) => batch.delete(doc.ref));

    // Delete responses
    const responsesSnap = await db.collection('runs').doc(currentRunCode).collection('responses').get();
    responsesSnap.forEach((doc) => batch.delete(doc.ref));

    // Delete questions
    const questionsSnap = await db.collection('runs').doc(currentRunCode).collection('questions').get();
    questionsSnap.forEach((doc) => batch.delete(doc.ref));

    // Delete question stats
    const statsSnap = await db.collection('runs').doc(currentRunCode).collection('questionStats').get();
    statsSnap.forEach((doc) => batch.delete(doc.ref));

    // Delete run
    batch.delete(db.collection('runs').doc(currentRunCode));

    await batch.commit();
    showToast('Quiz deleted!');
    showDashboard();
  } catch (error) {
    console.error('Delete run error:', error);
    showToast('Error deleting quiz');
  }
}

// Screen management
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach((s) => {
    s.style.display = 'none';
  });
  document.getElementById(screenId).style.display = 'flex';
}
