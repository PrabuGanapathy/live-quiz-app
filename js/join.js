// ============================================================================
// PLAYER JOIN LOGIC
// ============================================================================

let currentRunData = null;

// On page load, check if run code is in URL
document.addEventListener('DOMContentLoaded', () => {
  const runCodeFromUrl = getUrlParam('run');
  if (runCodeFromUrl) {
    document.getElementById('runCode').value = runCodeFromUrl.toUpperCase();
    loadGroupsForRun(runCodeFromUrl);
  }

  document.getElementById('joinBtn').addEventListener('click', handleJoinQuiz);
  document.getElementById('runCode').addEventListener('change', (e) => {
    const code = e.target.value.trim().toUpperCase();
    if (code.length === 6) {
      loadGroupsForRun(code);
    }
  });
});

// Load groups from Firestore for a specific run
async function loadGroupsForRun(runCode) {
  const groupSelect = document.getElementById('playerGroup');
  const groupLoading = document.getElementById('groupLoading');
  const groupError = document.getElementById('groupError');

  groupSelect.innerHTML = '<option value="">-- Select a group --</option>';
  groupLoading.style.display = 'block';
  groupError.style.display = 'none';

  try {
    const runRef = db.collection('runs').doc(runCode);
    const runDoc = await runRef.get();

    if (!runDoc.exists) {
      groupError.textContent = 'Run code not found';
      groupError.style.display = 'block';
      groupLoading.style.display = 'none';
      return;
    }

    currentRunData = runDoc.data();
    const groups = currentRunData.groups || [];

    groups.forEach((group) => {
      const option = document.createElement('option');
      option.value = group;
      option.textContent = group;
      groupSelect.appendChild(option);
    });

    if (groups.length === 0) {
      groupError.textContent = 'No groups available for this run';
      groupError.style.display = 'block';
    }
  } catch (error) {
    console.error('Error loading groups:', error);
    groupError.textContent = 'Error loading groups. Try again.';
    groupError.style.display = 'block';
  }

  groupLoading.style.display = 'none';
}

// Handle join quiz button click
async function handleJoinQuiz() {
  const playerName = document.getElementById('playerName').value.trim();
  const playerGroup = document.getElementById('playerGroup').value;
  const runCode = document.getElementById('runCode').value.trim().toUpperCase();

  // Validation
  if (!playerName) {
    showToast('Please enter your name');
    return;
  }
  if (!playerGroup) {
    showToast('Please select a group');
    return;
  }
  if (runCode.length !== 6) {
    showToast('Run code must be 6 characters');
    return;
  }

  // Show loading
  document.getElementById('loadingScreen').style.display = 'flex';
  document.getElementById('joinBtn').disabled = true;

  try {
    // Generate player ID
    const playerId = generatePlayerId();

    // Verify run exists and get status
    const runRef = db.collection('runs').doc(runCode);
    const runDoc = await runRef.get();

    if (!runDoc.exists) {
      throw new Error('Run not found');
    }

    const runData = runDoc.data();

    // Check if run is closed
    if (runData.status === 'closed') {
      throw new Error('This quiz has ended');
    }

    // Add player to Firestore
    await runRef.collection('players').doc(playerId).set({
      name: playerName,
      group: playerGroup,
      totalScore: 0,
      totalCorrect: 0,
      totalAnswered: 0,
      joinedAt: new Date()
    });

    // Store locally
    localStore('playerId', playerId);
    localStore('playerName', playerName);
    localStore('playerGroup', playerGroup);
    localStore('runCode', runCode);

    // Redirect to play page
    setTimeout(() => {
      window.location.href = `play.html?run=${runCode}`;
    }, 500);
  } catch (error) {
    console.error('Join error:', error);
    showToast(error.message || 'Failed to join quiz');
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('joinBtn').disabled = false;
  }
}
