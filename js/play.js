// ============================================================================
// PLAYER PLAY LOGIC - REAL-TIME QUIZ GAMEPLAY
// ============================================================================

let playerId, playerName, playerGroup, runCode, runData;
let currentQuestionIndex = -1;
let currentQuestion = null;
let playerScore = 0;
let playerCorrect = 0;
let playerAnswered = 0;
let hasAnswered = false;
let timerInterval = null;
let timeRemaining = 0;
let answerStartTime = null;
let unsubscribeRun = null;

// Initialize player session
document.addEventListener('DOMContentLoaded', async () => {
  // Retrieve player data from localStorage
  playerId = localRetrieve('playerId');
  playerName = localRetrieve('playerName');
  playerGroup = localRetrieve('playerGroup');
  runCode = getUrlParam('run') || localRetrieve('runCode');

  if (!playerId || !playerName || !playerGroup || !runCode) {
    window.location.href = 'index.html';
    return;
  }

  // Display player info in lobby
  document.getElementById('lobbyPlayerName').textContent = playerName;
  document.getElementById('lobbyPlayerGroup').textContent = `Group: ${playerGroup}`;
  document.getElementById('playerNameDisplay').textContent = playerName;
  document.getElementById('playerGroupDisplay').textContent = playerGroup;
  document.getElementById('finalPlayerName').textContent = playerName;
  document.getElementById('finalPlayerGroup').textContent = `Group: ${playerGroup}`;

  try {
    // Verify run exists
    const runRef = db.collection('runs').doc(runCode);
    const runDoc = await runRef.get();

    if (!runDoc.exists) {
      showToast('Run not found');
      window.location.href = 'index.html';
      return;
    }

    runData = runDoc.data();

    // Listen to run status changes
    unsubscribeRun = runRef.onSnapshot((doc) => {
      runData = doc.data();
      updateRunStatus();
    });

    // Setup exit handlers
    document.getElementById('exitBtn').addEventListener('click', handleExit);
    document.getElementById('leaderboardBtn').addEventListener('click', showLeaderboard);
    document.getElementById('closeLeaderboardBtn').addEventListener('click', hideLeaderboard);
    document.getElementById('leaderboardExitBtn').addEventListener('click', hideLeaderboard);
  } catch (error) {
    console.error('Init error:', error);
    showToast('Error loading quiz');
  }
});

// Update based on run status
function updateRunStatus() {
  const prevIndex = currentQuestionIndex;
  currentQuestionIndex = runData.currentQuestionIndex || -1;

  if (runData.status === 'lobby') {
    showScreen('lobbyScreen');
  } else if (runData.status === 'live') {
    if (currentQuestionIndex === -1) {
      showScreen('lobbyScreen');
    } else if (currentQuestionIndex !== prevIndex) {
      hasAnswered = false;
      loadQuestion(currentQuestionIndex);
    }
  } else if (runData.status === 'closed') {
    if (timerInterval) clearInterval(timerInterval);
    showFinalScreen();
  }
}

// Load and display a specific question
async function loadQuestion(qIndex) {
  try {
    const qRef = db.collection('runs').doc(runCode).collection('questions').doc(String(qIndex));
    const qDoc = await qRef.get();

    if (!qDoc.exists) {
      console.error('Question not found:', qIndex);
      return;
    }

    currentQuestion = qDoc.data();
    const totalQuestions = runData.numQuestions || 1;

    document.getElementById('questionNumber').textContent = qIndex + 1;
    document.getElementById('questionTotal').textContent = totalQuestions;
    document.getElementById('questionText').textContent = currentQuestion.text;

    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach((btn, idx) => {
      btn.textContent = currentQuestion.options[idx] || '';
      btn.style.backgroundColor = BUTTON_COLORS[idx];
      btn.dataset.index = idx;
      btn.disabled = false;
      btn.classList.remove('selected', 'correct', 'incorrect');
      btn.addEventListener('click', handleAnswerClick);
    });

    hasAnswered = false;
    answerStartTime = Date.now();
    timeRemaining = currentQuestion.timeLimit || 30;
    startTimer();

    showScreen('questionScreen');
  } catch (error) {
    console.error('Load question error:', error);
  }
}

// Timer logic with animated ring
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  const timeLimitMs = (currentQuestion.timeLimit || 30) * 1000;
  const updateInterval = 100;
  let elapsed = 0;

  timerInterval = setInterval(() => {
    elapsed += updateInterval;
    timeRemaining = Math.max(0, (currentQuestion.timeLimit || 30) - Math.floor(elapsed / 1000));

    document.getElementById('timerText').textContent = timeRemaining + 's';

    const progress = Math.min(100, (elapsed / timeLimitMs) * 100);
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    document.getElementById('timerProgress').style.strokeDashoffset = strokeDashoffset;

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      if (!hasAnswered) {
        submitAnswer(null);
      }
    }
  }, updateInterval);
}

// Handle answer button click
function handleAnswerClick(e) {
  if (hasAnswered) return;

  const selectedIndex = parseInt(e.target.dataset.index);
  submitAnswer(selectedIndex);
}

// Submit answer to Firestore
async function submitAnswer(selectedIndex) {
  if (hasAnswered) return;

  hasAnswered = true;
  clearInterval(timerInterval);

  const timeTakenMs = Date.now() - answerStartTime;
  const isCorrect = selectedIndex !== null && selectedIndex === currentQuestion.correctIndex;
  const points = isCorrect ? calculatePoints(timeTakenMs, (currentQuestion.timeLimit || 30) * 1000) : 0;

  try {
    const responsesRef = db.collection('runs').doc(runCode).collection('responses');
    await responsesRef.add({
      playerId: playerId,
      playerName: playerName,
      group: playerGroup,
      qIndex: currentQuestionIndex,
      selectedIndex: selectedIndex,
      correct: isCorrect,
      timeTakenMs: timeTakenMs,
      points: points,
      answeredAt: new Date()
    });

    const playerRef = db.collection('runs').doc(runCode).collection('players').doc(playerId);
    playerCorrect += isCorrect ? 1 : 0;
    playerAnswered += 1;
    playerScore += points;

    await playerRef.update({
      totalScore: playerScore,
      totalCorrect: playerCorrect,
      totalAnswered: playerAnswered
    });

    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach((btn, idx) => {
      if (idx === selectedIndex) {
        btn.classList.add(isCorrect ? 'correct' : 'incorrect');
      }
      btn.disabled = true;
    });

    showFeedback(isCorrect, points, timeTakenMs);
  } catch (error) {
    console.error('Submit answer error:', error);
    showToast('Error submitting answer');
    hasAnswered = false;
  }
}

// Display feedback
function showFeedback(isCorrect, points, timeTakenMs) {
  const feedbackIcon = document.getElementById('feedbackIcon');
  const feedbackTitle = document.getElementById('feedbackTitle');
  const feedbackMessage = document.getElementById('feedbackMessage');

  if (isCorrect) {
    feedbackIcon.textContent = '✓';
    feedbackIcon.className = 'feedback-icon correct';
    feedbackTitle.textContent = 'Correct!';
    feedbackMessage.textContent = `You answered in ${Math.round(timeTakenMs / 1000)}s`;
  } else {
    feedbackIcon.textContent = '✗';
    feedbackIcon.className = 'feedback-icon incorrect';
    feedbackTitle.textContent = 'Wrong';
    feedbackMessage.textContent = `The correct answer was: ${currentQuestion.options[currentQuestion.correctIndex]}`;
  }

  document.getElementById('roundPoints').textContent = points;
  document.getElementById('totalScore').textContent = playerScore;

  checkFastestThree();
  loadLeaderboardSnippet();

  showScreen('feedbackScreen');
}

// Check if player was top 3 fastest
async function checkFastestThree() {
  try {
    const statsRef = db.collection('runs').doc(runCode).collection('questionStats').doc(String(currentQuestionIndex));
    const statsDoc = await statsRef.get();

    if (statsDoc.exists && statsDoc.data().fastestThree) {
      const fastest = statsDoc.data().fastestThree;
      const isTopThree = fastest.some(f => f.playerId === playerId);

      if (isTopThree) {
        document.getElementById('badgeContainer').style.display = 'block';
      } else {
        document.getElementById('badgeContainer').style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Check fastest error:', error);
  }
}

// Load leaderboard snippet
async function loadLeaderboardSnippet() {
  try {
    const playersRef = db.collection('runs').doc(runCode).collection('players');
    const snapshot = await playersRef.orderBy('totalScore', 'desc').limit(5).get();

    let html = '';
    snapshot.forEach((doc, idx) => {
      const player = doc.data();
      html += `<div class="leaderboard-item">
        <span class="rank">${idx + 1}</span>
        <span class="name">${player.name}</span>
        <span class="score">${player.totalScore}</span>
      </div>`;
    });

    document.getElementById('leaderboardList').innerHTML = html;
    document.getElementById('leaderboardSnippet').style.display = 'block';
  } catch (error) {
    console.error('Load leaderboard error:', error);
  }
}

// Show full leaderboard
async function showLeaderboard() {
  try {
    const playersRef = db.collection('runs').doc(runCode).collection('players');
    const snapshot = await playersRef.orderBy('totalScore', 'desc').get();

    let html = '<table class="leaderboard-table"><tbody>';
    snapshot.forEach((doc, idx) => {
      const player = doc.data();
      const accuracy = player.totalAnswered > 0 ? Math.round((player.totalCorrect / player.totalAnswered) * 100) : 0;
      html += `<tr>
        <td class="rank">${idx + 1}</td>
        <td class="name">${player.name}</td>
        <td class="group">${player.group}</td>
        <td class="score">${player.totalScore}</td>
        <td class="accuracy">${accuracy}%</td>
      </tr>`;
    });
    html += '</tbody></table>';

    document.getElementById('leaderboardContent').innerHTML = html;
    showScreen('leaderboardScreen');
  } catch (error) {
    console.error('Show leaderboard error:', error);
  }
}

// Hide leaderboard
function hideLeaderboard() {
  if (runData.status === 'closed') {
    showScreen('finalScreen');
  } else {
    showScreen('feedbackScreen');
  }
}

// Show final score screen
async function showFinalScreen() {
  try {
    const playerRef = db.collection('runs').doc(runCode).collection('players').doc(playerId);
    const playerDoc = await playerRef.get();

    if (playerDoc.exists) {
      const player = playerDoc.data();
      const accuracy = player.totalAnswered > 0 ? Math.round((player.totalCorrect / player.totalAnswered) * 100) : 0;

      document.getElementById('finalScoreValue').textContent = player.totalScore;
      document.getElementById('finalCorrect').textContent = player.totalCorrect;
      document.getElementById('finalAccuracy').textContent = accuracy + '%';
    }
  } catch (error) {
    console.error('Final screen error:', error);
  }

  showScreen('finalScreen');
}

// Screen management
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.style.display = 'none';
  });
  document.getElementById(screenId).style.display = 'flex';
}

// Handle exit
function handleExit() {
  if (unsubscribeRun) unsubscribeRun();
  if (timerInterval) clearInterval(timerInterval);

  localClear('playerId');
  localClear('playerName');
  localClear('playerGroup');
  localClear('runCode');

  window.location.href = 'index.html';
}

window.addEventListener('beforeunload', () => {
  if (unsubscribeRun) unsubscribeRun();
  if (timerInterval) clearInterval(timerInterval);
});
