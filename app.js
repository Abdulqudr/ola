/* Enhanced Connect Four with Dashboard, Multiplayer, Themes & Farcaster Auth */
const COLUMNS = 7;
const ROWS = 6;
const PLAYER = 1;
const AI = 2;
const PLAYER1 = 1;
const PLAYER2 = 3;

let board = null;
let isPlayerTurn = true;
let gameOver = false;
let difficulty = 'easy';
let currentWinPositions = null;
let gameMode = 'single';
let currentPlayer = PLAYER1;

const boardEl = document.getElementById('board');
const aiPulseEl = document.getElementById('aiPulse');
const sfxPlaceEl = document.getElementById('sfxPlace');
const sfxWinEl = document.getElementById('sfxWin');
const statusTextEl = document.getElementById('statusText');
const playerWinsEl = document.getElementById('playerWins');
const aiWinsEl = document.getElementById('aiWins');
let lastMove = null;

// Enhanced Game State
let winStreak = 0;
let bestStreak = 0;
let totalGames = 0;
let playerWins = 0;
let currentChallenge = null;
let achievements = {};
let lastPlayedDate = null;
let gameStartTime = null;
let perfectWins = 0;
let comebackWins = 0;
let hardModeWins = 0;
let mediumModeWins = 0;
let flawlessWins = 0;

// Multiplayer state
let multiplayerSessionStats = {
    player1: { name: "Player 1", wins: 0 },
    player2: { name: "Player 2", wins: 0 }
};

// Permanent multiplayer stats
let multiplayerStats = {
    player1: { name: "Player 1", wins: 0, achievements: 0 },
    player2: { name: "Player 2", wins: 0, achievements: 0 }
};

// Farcaster authentication state
let userToken = null;
let userData = null;
let farcasterUsers = {};

// Settings
const SETTINGS_KEY = 'fourinrow_settings_v3';
let settings = { sound: true, theme: 'neon', avatar: 'male' };

// Screen Management
let currentScreen = 'dashboard';

// Authentication Functions
async function signIn() {
    try {
        console.log('Starting Farcaster authentication...');
        
        if (!window.sdk) {
            throw new Error('Farcaster SDK not available');
        }

        const { token } = await window.sdk.quickAuth.getToken();
        userToken = token;
        
        // Verify token with backend (using mock for now)
        const authSuccess = await verifyToken(token);
        
        if (authSuccess) {
            // Store user data
            const fid = extractFidFromToken(token);
            userData = { 
                fid: fid,
                username: `user_${fid}`,
                displayName: `Player ${fid}`
            };
            
            // Save to localStorage
            localStorage.setItem('farcasterUser', JSON.stringify({
                token: userToken,
                fid: userData.fid,
                username: userData.username,
                timestamp: Date.now()
            }));

            // Add to farcaster users if not exists
            if (!farcasterUsers[fid]) {
                farcasterUsers[fid] = {
                    fid: fid,
                    username: userData.username,
                    displayName: userData.displayName,
                    wins: 0,
                    achievements: 0,
                    bestStreak: 0
                };
                saveFarcasterUsers();
            }

            updateAuthUI();
            showAchievementToast({
                name: "Welcome!",
                desc: "Successfully signed in with Farcaster",
                emoji: "🔐",
                tier: "easy"
            });
            
            console.log('Farcaster authentication successful:', userData);
            updateLeaderboardDisplay();
        } else {
            throw new Error('Token verification failed');
        }
    } catch (error) {
        console.error('Farcaster authentication failed:', error);
        showError('Failed to sign in with Farcaster. Please try again.');
    }
}

function signOut() {
    userToken = null;
    userData = null;
    localStorage.removeItem('farcasterUser');
    updateAuthUI();
    showAchievementToast({
        name: "Signed Out",
        desc: "You have been signed out",
        emoji: "👋",
        tier: "easy"
    });
}

function loadUserData() {
    try {
        const saved = localStorage.getItem('farcasterUser');
        if (saved) {
            const user = JSON.parse(saved);
            // Check if token is still valid (less than 1 hour old)
            if (Date.now() - user.timestamp < 3600000) {
                userToken = user.token;
                userData = { 
                    fid: user.fid,
                    username: user.username,
                    displayName: `Player ${user.fid}`
                };
                return true;
            }
        }
    } catch (e) {
        console.log('Error loading user data:', e);
    }
    return false;
}

function updateAuthUI() {
    const authStatus = document.getElementById('authStatus');
    const signInBtn = document.getElementById('signInBtn');
    const userInfo = document.getElementById('userInfo');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userData) {
        // User is signed in
        authStatus.classList.remove('hidden');
        signInBtn.classList.add('hidden');
        userInfo.textContent = `FID: ${userData.fid}`;
        userAvatar.textContent = userData.fid.toString().charAt(0);
        
        // Update player name in game if screen is active
        if (currentScreen === 'game' && gameMode === 'single') {
            document.querySelector('.player-info .player-name').textContent = userData.displayName;
        }
    } else {
        // User is signed out
        authStatus.classList.add('hidden');
        signInBtn.classList.remove('hidden');
    }
}

// Mock token verification (replace with real API call)
async function verifyToken(token) {
    // In a real app, you would call your backend API
    // For now, we'll simulate successful verification
    return new Promise(resolve => {
        setTimeout(() => resolve(true), 500);
    });
}

function extractFidFromToken(token) {
    // Mock FID extraction - in real app, decode JWT
    return Math.floor(1000 + Math.random() * 9000);
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.style.background = 'linear-gradient(45deg, #ff6b6b, #ff8e53)';
    toast.innerHTML = `
        <div class="achievement-emoji">❌</div>
        <div class="achievement-title">Error</div>
        <div class="achievement-desc">${message}</div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Farcaster users management
function loadFarcasterUsers() {
    try {
        const users = localStorage.getItem('farcasterUsers');
        if (users) {
            farcasterUsers = JSON.parse(users);
        }
    } catch (e) {
        console.log('Error loading farcaster users:', e);
        farcasterUsers = {};
    }
}

function saveFarcasterUsers() {
    try {
        localStorage.setItem('farcasterUsers', JSON.stringify(farcasterUsers));
    } catch (e) {
        console.log('Error saving farcaster users:', e);
    }
}

function updateFarcasterUserStats(won = false) {
    if (!userData) return;
    
    const fid = userData.fid;
    if (!farcasterUsers[fid]) return;
    
    if (won) {
        farcasterUsers[fid].wins++;
        if (winStreak > farcasterUsers[fid].bestStreak) {
            farcasterUsers[fid].bestStreak = winStreak;
        }
        farcasterUsers[fid].achievements = getAchievementsCount();
    }
    
    saveFarcasterUsers();
}

// Existing game functions (keeping all your original game logic)
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.classList.add('hidden');
    });
    
    const targetScreen = document.getElementById(screenName + 'Screen');
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.classList.add('active');
    }
    
    currentScreen = screenName;
    
    if (screenName === 'game') {
        updateGameStatus();
        updateWinCounters();
    } else if (screenName === 'dashboard') {
        updateDashboardStreak();
        if (gameMode === 'multiplayer') {
            resetMultiplayerSession();
        }
    }
}

function resetMultiplayerSession() {
    multiplayerSessionStats = {
        player1: { name: "Player 1", wins: 0 },
        player2: { name: "Player 2", wins: 0 }
    };
}

const ACHIEVEMENTS = {
    firstWin: { 
        name: "First Blood", 
        desc: "Win your first game", 
        emoji: "🩸",
        tier: "easy",
        condition: (stats) => stats.playerWins >= 1,
        progress: (stats) => Math.min(stats.playerWins, 1)
    },
    streak3: { 
        name: "On Fire!", 
        desc: "Win 3 games in a row", 
        emoji: "🔥",
        tier: "easy",
        condition: (stats) => stats.bestStreak >= 3,
        progress: (stats) => Math.min(stats.bestStreak, 3) / 3
    },
    totalWins10: { 
        name: "Decathlete", 
        desc: "Win 10 total games", 
        emoji: "🔟",
        tier: "easy",
        condition: (stats) => stats.totalWins >= 10,
        progress: (stats) => Math.min(stats.totalWins, 10) / 10
    },
    easyMaster: { 
        name: "Easy Breezy", 
        desc: "Win 5 games on Easy difficulty", 
        emoji: "😊",
        tier: "easy",
        condition: (stats) => stats.easyWins >= 5,
        progress: (stats) => Math.min(stats.easyWins, 5) / 5
    },
    streak5: { 
        name: "Unstoppable!", 
        desc: "Win 5 games in a row", 
        emoji: "⚡",
        tier: "medium",
        condition: (stats) => stats.bestStreak >= 5,
        progress: (stats) => Math.min(stats.bestStreak, 5) / 5
    },
    farcasterUser: {
        name: "Farcaster Connected",
        desc: "Sign in with Farcaster account",
        emoji: "🔐",
        tier: "easy",
        condition: (stats) => stats.hasFarcaster,
        progress: (stats) => stats.hasFarcaster ? 1 : 0
    }
};

function loadSettings(){
    try{
        const raw = localStorage.getItem(SETTINGS_KEY);
        if(!raw) return;
        const parsed = JSON.parse(raw);
        settings = Object.assign(settings, parsed);
        applyTheme(settings.theme);
    }catch(e){}
}

function saveSettings(){
    try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }catch(e){}
}

function applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    settings.theme = themeName;
    saveSettings();
    if (board) {
        renderBoard();
    }
}

function loadGameStats() {
    try {
        const stats = JSON.parse(localStorage.getItem('four_gameStats') || '{}');
        totalGames = stats.totalGames || 0;
        playerWins = stats.playerWins || 0;
        winStreak = stats.winStreak || 0;
        bestStreak = stats.bestStreak || 0;
        achievements = stats.achievements || {};
        perfectWins = stats.perfectWins || 0;
        comebackWins = stats.comebackWins || 0;
        hardModeWins = stats.hardModeWins || 0;
        mediumModeWins = stats.mediumModeWins || 0;
        flawlessWins = stats.flawlessWins || 0;
        lastPlayedDate = stats.lastPlayedDate || null;
        
        const multiplayerData = JSON.parse(localStorage.getItem('four_multiplayerStats') || '{}');
        multiplayerStats = Object.assign(multiplayerStats, multiplayerData);
        
        Object.keys(ACHIEVEMENTS).forEach(key => {
            if (achievements[key] === undefined) {
                achievements[key] = { unlocked: false, progress: 0 };
            }
        });
    } catch(e) {
        console.log('Error loading stats:', e);
        resetGameStats();
    }
}

function saveGameStats() {
    const stats = {
        totalGames,
        playerWins,
        winStreak,
        bestStreak,
        achievements,
        perfectWins,
        comebackWins,
        hardModeWins,
        mediumModeWins,
        flawlessWins,
        lastPlayedDate
    };
    localStorage.setItem('four_gameStats', JSON.stringify(stats));
    localStorage.setItem('four_multiplayerStats', JSON.stringify(multiplayerStats));
}

function resetGameStats() {
    totalGames = 0;
    playerWins = 0;
    winStreak = 0;
    bestStreak = 0;
    perfectWins = 0;
    comebackWins = 0;
    hardModeWins = 0;
    mediumModeWins = 0;
    flawlessWins = 0;
    achievements = {};
    Object.keys(ACHIEVEMENTS).forEach(key => {
        achievements[key] = { unlocked: false, progress: 0 };
    });
    saveGameStats();
}

function updateWinCounters() {
    if (playerWinsEl) playerWinsEl.textContent = playerWins;
    if (aiWinsEl) aiWinsEl.textContent = totalGames - playerWins;
    updateStreakDisplay();
}

function updateDashboardStreak() {
    const streakCountEl = document.getElementById('streakCount');
    if (streakCountEl) {
        streakCountEl.textContent = winStreak;
    }
}

function updateStreakDisplay() {
    let streakEl = document.getElementById('streakIndicator');
    if (!streakEl) {
        streakEl = document.createElement('div');
        streakEl.id = 'streakIndicator';
        streakEl.className = 'streak-indicator hidden';
        document.querySelector('.app').appendChild(streakEl);
    }
    
    if (winStreak >= 3) {
        streakEl.textContent = `🔥 ${winStreak} Win Streak!`;
        streakEl.classList.remove('hidden');
        if (winStreak >= 10) {
            streakEl.classList.add('fire-animation');
        } else {
            streakEl.classList.remove('fire-animation');
        }
    } else {
        streakEl.classList.add('hidden');
        streakEl.classList.remove('fire-animation');
    }
}

function updateGameStatus() {
    if (gameOver) {
        statusTextEl.textContent = '';
        return;
    }
    
    if (gameMode === 'multiplayer') {
        if (currentPlayer === PLAYER1) {
            statusTextEl.textContent = `${multiplayerSessionStats.player1.name}'s TURN`;
        } else {
            statusTextEl.textContent = `${multiplayerSessionStats.player2.name}'s TURN`;
        }
    } else {
        if (isPlayerTurn) {
            statusTextEl.textContent = 'YOUR TURN';
        } else {
            statusTextEl.textContent = 'COMPUTER';
        }
    }
}

function checkAchievements() {
    const stats = getCurrentStats();
    let newAchievements = [];
    
    Object.keys(ACHIEVEMENTS).forEach(key => {
        const achievement = ACHIEVEMENTS[key];
        const currentState = achievements[key];
        
        if (!currentState.unlocked && achievement.condition(stats)) {
            achievements[key].unlocked = true;
            achievements[key].progress = 1;
            newAchievements.push(achievement);
        } else if (!currentState.unlocked) {
            achievements[key].progress = achievement.progress(stats);
        }
    });
    
    if (newAchievements.length > 0) {
        showAchievementToast(newAchievements[0]);
    }
    
    saveGameStats();
    updateStatsDisplay();
}

function getCurrentStats() {
    return {
        playerWins,
        totalWins: playerWins,
        bestStreak,
        easyWins: difficulty === 'easy' ? 1 : 0,
        mediumWins: mediumModeWins,
        hardWins: hardModeWins,
        comebackWins,
        perfectWins,
        flawlessWins,
        hasFarcaster: !!userData,
        flawlessStreak: 0,
        veryFastWins: 0,
        lightningWins: 0,
        comebackKingWins: 0,
        ultimateComebacks: 0
    };
}

function getAchievementsCount() {
    return Object.values(achievements).filter(achievement => achievement.unlocked).length;
}

function showAchievementToast(achievement) {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    
    let tierColor = '';
    switch(achievement.tier) {
        case 'easy': tierColor = '#4CAF50'; break;
        case 'medium': tierColor = '#FF9800'; break;
        case 'hard': tierColor = '#F44336'; break;
        case 'grandmaster': tierColor = '#9C27B0'; break;
        default: tierColor = '#2196F3';
    }
    
    toast.style.background = `linear-gradient(45deg, ${tierColor}, ${tierColor}dd)`;
    
    toast.innerHTML = `
        <div class="achievement-emoji">${achievement.emoji}</div>
        <div class="achievement-title">${achievement.name}</div>
        <div class="achievement-desc">${achievement.desc}</div>
        <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">${achievement.tier.toUpperCase()} TIER</div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

function updateStatsDisplay() {
    document.getElementById('statTotalGames').textContent = totalGames;
    document.getElementById('statWinRate').textContent = totalGames > 0 ? 
        Math.round((playerWins / totalGames) * 100) + '%' : '0%';
    document.getElementById('statCurrentStreak').textContent = winStreak;
    document.getElementById('statBestStreak').textContent = bestStreak;
    
    updateAchievementsList();
}

function updateLeaderboardDisplay() {
    updateSinglePlayerLeaderboard();
    updateMultiplayerLeaderboard();
    updateFarcasterLeaderboard();
}

function updateSinglePlayerLeaderboard() {
    const singleLeaderboard = document.getElementById('singleLeaderboard');
    if (!singleLeaderboard) return;
    
    singleLeaderboard.innerHTML = '';
    
    const achievementsCount = getAchievementsCount();
    
    const entryEl = document.createElement('div');
    entryEl.className = 'leaderboard-entry';
    entryEl.innerHTML = `
        <div class="leaderboard-rank">#1</div>
        <div class="leaderboard-player">
            <div class="leaderboard-avatar">${userData ? userData.fid.toString().charAt(0) : 'Y'}</div>
            <div class="leaderboard-name">${userData ? `Player ${userData.fid}` : 'You'}</div>
        </div>
        <div class="leaderboard-score">${playerWins} Wins</div>
        <div class="leaderboard-achievements">${achievementsCount} Achievements</div>
    `;
    singleLeaderboard.appendChild(entryEl);
}

function updateMultiplayerLeaderboard() {
    const multiplayerLeaderboard = document.getElementById('multiplayerLeaderboard');
    if (!multiplayerLeaderboard) return;
    
    multiplayerLeaderboard.innerHTML = '';
    
    const entries = [
        { 
            name: multiplayerStats.player1.name, 
            wins: multiplayerStats.player1.wins, 
            achievements: multiplayerStats.player1.achievements 
        },
        { 
            name: multiplayerStats.player2.name, 
            wins: multiplayerStats.player2.wins, 
            achievements: multiplayerStats.player2.achievements 
        }
    ].sort((a, b) => {
        if (b.wins !== a.wins) {
            return b.wins - a.wins;
        }
        return b.achievements - a.achievements;
    });
    
    entries.forEach((entry, index) => {
        const entryEl = document.createElement('div');
        entryEl.className = 'leaderboard-entry';
        entryEl.innerHTML = `
            <div class="leaderboard-rank">#${index + 1}</div>
            <div class="leaderboard-player">
                <div class="leaderboard-avatar">${entry.name.charAt(0)}</div>
                <div class="leaderboard-name">${entry.name}</div>
            </div>
            <div class="leaderboard-score">${entry.wins} Wins</div>
            <div class="leaderboard-achievements">${entry.achievements} Achievements</div>
        `;
        multiplayerLeaderboard.appendChild(entryEl);
    });
}

function updateFarcasterLeaderboard() {
    const farcasterLeaderboard = document.getElementById('farcasterLeaderboard');
    if (!farcasterLeaderboard) return;
    
    farcasterLeaderboard.innerHTML = '';
    
    const entries = Object.values(farcasterUsers)
        .sort((a, b) => {
            if (b.wins !== a.wins) {
                return b.wins - a.wins;
            }
            return b.bestStreak - a.bestStreak;
        })
        .slice(0, 10); // Top 10
    
    if (entries.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'leaderboard-entry';
        emptyEl.innerHTML = `
            <div style="text-align: center; color: var(--muted); padding: 20px;">
                No Farcaster users yet. Sign in to appear here!
            </div>
        `;
        farcasterLeaderboard.appendChild(emptyEl);
        return;
    }
    
    entries.forEach((entry, index) => {
        const entryEl = document.createElement('div');
        entryEl.className = 'leaderboard-entry';
        const isCurrentUser = userData && userData.fid === entry.fid;
        entryEl.style.border = isCurrentUser ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.05)';
        entryEl.innerHTML = `
            <div class="leaderboard-rank">#${index + 1}</div>
            <div class="leaderboard-player">
                <div class="leaderboard-avatar" style="background: ${isCurrentUser ? 'linear-gradient(135deg, var(--accent), #3fd6ff)' : 'linear-gradient(135deg, #667eea, #764ba2)'}">${entry.displayName?.charAt(0) || entry.username?.charAt(0) || 'U'}</div>
                <div class="leaderboard-name">${entry.displayName || entry.username} ${isCurrentUser ? ' (You)' : ''}</div>
            </div>
            <div class="leaderboard-score">${entry.wins} Wins</div>
            <div class="leaderboard-achievements">${entry.achievements} Achievements</div>
        `;
        farcasterLeaderboard.appendChild(entryEl);
    });
}

function updateAchievementsList() {
    const listEl = document.getElementById('achievementList');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    const tiers = {
        easy: [],
        medium: [],
        hard: [],
        grandmaster: []
    };
    
    Object.keys(ACHIEVEMENTS).forEach(key => {
        const achievement = ACHIEVEMENTS[key];
        tiers[achievement.tier].push({key, achievement});
    });
    
    Object.keys(tiers).forEach(tier => {
        if (tiers[tier].length > 0) {
            const tierHeader = document.createElement('h4');
            tierHeader.style.margin = '16px 0 8px 0';
            tierHeader.style.color = getTierColor(tier);
            tierHeader.textContent = `${tier.toUpperCase()} TIER ACHIEVEMENTS`;
            listEl.appendChild(tierHeader);
            
            tiers[tier].forEach(({key, achievement}) => {
                const state = achievements[key];
                const progress = achievement.progress(getCurrentStats());
                
                const itemEl = document.createElement('div');
                itemEl.className = `achievement-item ${state.unlocked ? '' : 'locked'}`;
                itemEl.style.borderLeft = `4px solid ${getTierColor(achievement.tier)}`;
                itemEl.innerHTML = `
                    <div class="achievement-emoji">${achievement.emoji}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-description">${achievement.desc}</div>
                        ${!state.unlocked ? `
                            <div class="achievement-progress">
                                <div class="achievement-progress-bar" style="width: ${progress * 100}%"></div>
                            </div>
                        ` : '<div style="color: #4CAF50; font-size: 11px;">✓ UNLOCKED</div>'}
                    </div>
                `;
                
                listEl.appendChild(itemEl);
            });
        }
    });
}

function getTierColor(tier) {
    switch(tier) {
        case 'easy': return '#4CAF50';
        case 'medium': return '#FF9800';
        case 'hard': return '#F44336';
        case 'grandmaster': return '#9C27B0';
        default: return '#2196F3';
    }
}

// Audio functions
function playClick(){
    if(!settings.sound) return;
    try{
        if(sfxPlaceEl){ 
            sfxPlaceEl.currentTime = 0; 
            sfxPlaceEl.play().catch(()=>{}); 
        }
    }catch(e){}
}

function playWin(){
    if(!settings.sound) return;
    try{
        if(sfxWinEl){ 
            sfxWinEl.currentTime = 0; 
            sfxWinEl.play().catch(()=>{}); 
        }
    }catch(e){}
}

// Game logic functions (keeping all your original game functions)
function createBoard(){
    board = Array.from({length:ROWS},()=>Array.from({length:COLUMNS},()=>0));
    gameStartTime = Date.now();
}

function renderBoard(){
    boardEl.innerHTML = '';
    for(let r=0;r<ROWS;r++){
        for(let c=0;c<COLUMNS;c++){
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.setAttribute('role','button');
            cell.setAttribute('aria-label', `Column ${c+1}`);

            const disk = document.createElement('div');
            disk.className = 'disk';
            const val = board[r][c];
            
            if(val===PLAYER || val===PLAYER1){
                disk.style.background = 'linear-gradient(180deg, var(--player-disk-start), var(--player-disk-end))';
                disk.classList.add('present');
            } else if(val===AI){
                disk.style.background = 'linear-gradient(180deg, var(--ai-disk-start), var(--ai-disk-end))';
                disk.classList.add('present');
            } else if(val===PLAYER2){
                disk.style.background = 'linear-gradient(180deg, var(--player2-disk-start), var(--player2-disk-end))';
                disk.classList.add('present');
            }
            
            if(currentWinPositions){
                for(const p of currentWinPositions){
                    if(p.r==r && p.c==c){ disk.classList.add('win'); break; }
                }
            }
            cell.appendChild(disk);

            cell.addEventListener('click',()=>{
                if(gameOver) return;
                if(gameMode === 'single' && !isPlayerTurn) return;
                handlePlayerMove(c);
            });

            boardEl.appendChild(cell);
        }
    }

    if(lastMove){
        const d = boardEl.querySelector(`.cell[data-row="${lastMove.r}"][data-col="${lastMove.c}"] .disk`);
        if(d){ 
            d.classList.add('dropping'); 
            playClick(); 
        }
        setTimeout(()=>{
            if(d) d.classList.remove('dropping');
            lastMove = null;
        }, 520);
    }
}

function getNextOpenRow(col){
    for(let r=ROWS-1;r>=0;r--) if(board[r][col]===0) return r;
    return -1;
}

function isValidLocation(col){
    return board[0][col]===0;
}

function dropPiece(row,col,player){ board[row][col]=player; }

function winningMove(b, piece){
    for(let r=0;r<ROWS;r++){
        for(let c=0;c<COLUMNS-3;c++){
            if(b[r][c]===piece && b[r][c+1]===piece && b[r][c+2]===piece && b[r][c+3]===piece) return true;
        }
    }
    for(let c=0;c<COLUMNS;c++){
        for(let r=0;r<ROWS-3;r++){
            if(b[r][c]===piece && b[r+1][c]===piece && b[r+2][c]===piece && b[r+3][c]===piece) return true;
        }
    }
    for(let r=0;r<ROWS-3;r++){
        for(let c=0;c<COLUMNS-3;c++){
            if(b[r][c]===piece && b[r+1][c+1]===piece && b[r+2][c+2]===piece && b[r+3][c+3]===piece) return true;
        }
    }
    for(let r=3;r<ROWS;r++){
        for(let c=0;c<COLUMNS-3;c++){
            if(b[r][c]===piece && b[r-1][c+1]===piece && b[r-2][c+2]===piece && b[r-3][c+3]===piece) return true;
        }
    }
    return false;
}

function winningPositions(b, piece){
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLUMNS - 3; c++) {
            if (b[r][c] === piece && b[r][c + 1] === piece && b[r][c + 2] === piece && b[r][c + 3] === piece) {
                return [
                    { r: r, c: c },
                    { r: r, c: c + 1 },
                    { r: r, c: c + 2 },
                    { r: r, c: c + 3 },
                ];
            }
        }
    }
    for (let c = 0; c < COLUMNS; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            if (b[r][c] === piece && b[r + 1][c] === piece && b[r + 2][c] === piece && b[r + 3][c] === piece) {
                return [
                    { r: r, c: c },
                    { r: r + 1, c: c },
                    { r: r + 2, c: c },
                    { r: r + 3, c: c },
                ];
            }
        }
    }
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLUMNS - 3; c++) {
            if (b[r][c] === piece && b[r + 1][c + 1] === piece && b[r + 2][c + 2] === piece && b[r + 3][c + 3] === piece) {
                return [
                    { r: r, c: c },
                    { r: r + 1, c: c + 1 },
                    { r: r + 2, c: c + 2 },
                    { r: r + 3, c: c + 3 },
                ];
            }
        }
    }
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c < COLUMNS - 3; c++) {
            if (b[r][c] === piece && b[r - 1][c + 1] === piece && b[r - 2][c + 2] === piece && b[r - 3][c + 3] === piece) {
                return [
                    { r: r, c: c },
                    { r: r - 1, c: c + 1 },
                    { r: r - 2, c: c + 2 },
                    { r: r - 3, c: c + 3 },
                ];
            }
        }
    }
    return null;
}

function showOverlay(message){
    const overlayEl = document.getElementById('overlay');
    const overlayMessageEl = document.getElementById('overlayMessage');
    if(overlayMessageEl) overlayMessageEl.textContent = message;
    if(overlayEl){ overlayEl.classList.remove('hidden'); }
}

function hideOverlay(){
    const overlayEl = document.getElementById('overlay');
    if(overlayEl) overlayEl.classList.add('hidden');
}

function highlightWinningPositions(positions){
    clearWinHighlights();
    currentWinPositions = positions;
    renderBoard();
    if(!positions || positions.length<2) return;
    const first = positions[0];
    const last = positions[positions.length-1];
    const cells = boardEl.querySelectorAll('.cell');
    if(!cells || cells.length===0) return;
    const boardRect = boardEl.getBoundingClientRect();
    const firstEl = boardEl.querySelector(`.cell[data-row="${first.r}"][data-col="${first.c}"]`);
    const lastEl = boardEl.querySelector(`.cell[data-row="${last.r}"][data-col="${last.c}"]`);
    if(!firstEl || !lastEl) return;
    const fRect = firstEl.getBoundingClientRect();
    const lRect = lastEl.getBoundingClientRect();
    const fx = fRect.left + fRect.width/2 - boardRect.left;
    const fy = fRect.top + fRect.height/2 - boardRect.top;
    const lx = lRect.left + lRect.width/2 - boardRect.left;
    const ly = lRect.top + lRect.height/2 - boardRect.top;
    const dx = lx - fx;
    const dy = ly - fy;
    const len = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy,dx) * 180 / Math.PI;
    const line = document.createElement('div');
    line.className = 'win-line';
    line.style.width = `${len}px`;
    line.style.left = `${fx}px`;
    line.style.top = `${fy - 4}px`;
    line.style.transform = `rotate(${angle}deg)`;
    boardEl.appendChild(line);
}

function clearWinHighlights(){
    currentWinPositions = null;
    const lines = boardEl.querySelectorAll('.win-line');
    lines.forEach(l=>l.remove());
}

function isBoardFull(b){
    return b[0].every(v=>v!==0);
}

function handlePlayerMove(col){
    const row = getNextOpenRow(col);
    if(row===-1) return;
    
    let currentPiece;
    if (gameMode === 'multiplayer') {
        currentPiece = currentPlayer;
    } else {
        currentPiece = PLAYER;
    }
    
    dropPiece(row, col, currentPiece);
    lastMove = {r: row, c: col};
    renderBoard();
    
    const winPos = winningPositions(board, currentPiece);
    if(winPos){
        gameOver=true;
        highlightWinningPositions(winPos);
        
        let winMessage;
        if (gameMode === 'multiplayer') {
            const winnerName = currentPlayer === PLAYER1 ? multiplayerSessionStats.player1.name : multiplayerSessionStats.player2.name;
            winMessage = `${winnerName} Wins!`;
            
            if (currentPlayer === PLAYER1) {
                multiplayerSessionStats.player1.wins++;
            } else {
                multiplayerSessionStats.player2.wins++;
            }
            
            if (currentPlayer === PLAYER1) {
                multiplayerStats.player1.wins++;
            } else {
                multiplayerStats.player2.wins++;
            }
            saveGameStats();
        } else {
            const gameTime = (Date.now() - gameStartTime) / 1000;
            winMessage = 'You win!';
            
            if (gameTime < 30) winMessage = 'Lightning Fast! ⚡';
            else if (gameTime < 60) winMessage = 'Speed Demon! 🚀';
            else if (gameTime < 120) winMessage = 'Speed Runner! ⏱️';
            
            playerWins++;
            winStreak++;
            if (winStreak > bestStreak) {
                bestStreak = winStreak;
            }
            totalGames++;
            
            if (difficulty === 'medium') mediumModeWins++;
            if (difficulty === 'hard') hardModeWins++;
            
            if (Math.random() > 0.7) perfectWins++;
            
            // Update Farcaster user stats if signed in
            updateFarcasterUserStats(true);
            
            saveGameStats();
            checkAchievements();
        }
        
        showOverlay(winMessage);
        playWin();
        updateWinCounters();
        updateGameStatus();
        return;
    }
    
    if(isBoardFull(board)){ 
        gameOver=true; 
        showOverlay('Draw!'); 
        if (gameMode === 'single') {
            totalGames++;
            winStreak = 0;
            saveGameStats();
        }
        updateWinCounters();
        updateGameStatus(); 
        return; 
    }
    
    if (gameMode === 'multiplayer') {
        currentPlayer = currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;
    } else {
        isPlayerTurn = false;
        aiPulseEl && aiPulseEl.classList.add('pulsing');
        setTimeout(()=>computerMove(), 800);
    }
    
    updateGameStatus();
}

function computerMove(){
    if(gameOver) return;
    const move = computeAIMove(board, difficulty);
    if(move==null){ gameOver=true; showOverlay('Draw!'); updateGameStatus(); return; }
    const row = getNextOpenRow(move);
    if(row===-1){ gameOver=true; showOverlay('Error: invalid move'); updateGameStatus(); return; }
    dropPiece(row,move,AI);
    lastMove = {r: row, c: move};
    renderBoard();
    aiPulseEl && aiPulseEl.classList.remove('pulsing');
    const winPosAI = winningPositions(board, AI);
    if(winPosAI){
        gameOver=true;
        highlightWinningPositions(winPosAI);
        showOverlay('Computer wins');
        playWin();
        
        totalGames++;
        winStreak = 0;
        saveGameStats();
        updateWinCounters();
        updateGameStatus();
        return;
    }
    if(isBoardFull(board)){ 
        gameOver=true; 
        showOverlay('Draw!'); 
        totalGames++;
        winStreak = 0;
        saveGameStats();
        updateWinCounters();
        updateGameStatus(); 
        return; 
    }
    isPlayerTurn=true;
    updateGameStatus();
}

// AI functions
function computeAIMove(b,diff){
    const validCols = [];
    for(let c=0;c<COLUMNS;c++) if(isValidLocation(c)) validCols.push(c);
    if(validCols.length===0) return null;
    if(diff==='easy') return easyMove(b, validCols);
    if(diff==='medium') return mediumMove(b,validCols);
    return hardMove(b,6);
}

function easyMove(b, validCols){
    const centerCol = Math.floor(COLUMNS/2);
    const centerCols = [centerCol-1, centerCol, centerCol+1].filter(c => validCols.includes(c));
    
    if(centerCols.length > 0 && Math.random() < 0.7) {
        return centerCols[Math.floor(Math.random() * centerCols.length)];
    }
    return validCols[Math.floor(Math.random()*validCols.length)];
}

function mediumMove(b,validCols){
    for(const col of validCols){
        const row = getNextOpenRow(col);
        if(row === -1) continue;
        
        b[row][col] = AI;
        if(winningMove(b, AI)){
            b[row][col] = 0;
            return col;
        }
        b[row][col] = 0;
    }
    
    for(const col of validCols){
        const row = getNextOpenRow(col);
        if(row === -1) continue;
        
        b[row][col] = PLAYER;
        if(winningMove(b, PLAYER)){
            b[row][col] = 0;
            return col;
        }
        b[row][col] = 0;
    }
    
    const centerCol = Math.floor(COLUMNS/2);
    const centerCols = validCols.filter(c => Math.abs(c - centerCol) <= 2);
    if(centerCols.length > 0) {
        return centerCols[Math.floor(Math.random() * centerCols.length)];
    }
    
    return validCols[Math.floor(Math.random()*validCols.length)];
}

function hardMove(b,depth){
    const result = minimax(copyBoard(b), depth, -Infinity, Infinity, true);
    return result.col;
}

function copyBoard(b){
    return b.map(r=>r.slice());
}

function minimax(b,depth,alpha,beta,maximizingPlayer){
    const validLocations = [];
    for(let c=0;c<COLUMNS;c++) if(isValidLocationInBoard(b,c)) validLocations.push(c);
    const isTerminal = winningMove(b,PLAYER) || winningMove(b,AI) || validLocations.length===0;
    if(depth===0 || isTerminal){
        if(isTerminal){
            if(winningMove(b,AI)) return {score: 1000000000, col: null};
            else if(winningMove(b,PLAYER)) return {score: -1000000000, col: null};
            else return {score: 0, col: null};
        } else {
            return {score: evaluateBoard(b), col: null};
        }
    }

    if(maximizingPlayer){
        let value = -Infinity;
        let column = validLocations[Math.floor(Math.random()*validLocations.length)];
        for(const col of orderMoves(validLocations)){
            const row = getNextOpenRowInBoard(b,col);
            if(row===-1) continue;
            const bCopy = copyBoard(b);
            bCopy[row][col]=AI;
            const newScore = minimax(bCopy, depth-1, alpha, beta, false).score;
            if(newScore>value){ value=newScore; column=col; }
            alpha = Math.max(alpha, value);
            if(alpha>=beta) break;
        }
        return {score:value, col:column};
    } else {
        let value = Infinity;
        let column = validLocations[Math.floor(Math.random()*validLocations.length)];
        for(const col of orderMoves(validLocations)){
            const row = getNextOpenRowInBoard(b,col);
            if(row===-1) continue;
            const bCopy = copyBoard(b);
            bCopy[row][col]=PLAYER;
            const newScore = minimax(bCopy, depth-1, alpha, beta, true).score;
            if(newScore<value){ value=newScore; column=col; }
            beta = Math.min(beta, value);
            if(alpha>=beta) break;
        }
        return {score:value, col:column};
    }
}

function isValidLocationInBoard(b,col){ return b[0][col]===0; }
function getNextOpenRowInBoard(b,col){ for(let r=ROWS-1;r>=0;r--) if(b[r][col]===0) return r; return -1; }

function orderMoves(moves){
    const center = Math.floor(COLUMNS/2);
    return moves.sort((a,b)=>Math.abs(a-center)-Math.abs(b-center));
}

function evaluateBoard(b){
    let score = 0;
    const centerCol = Math.floor(COLUMNS/2);
    let centerCount=0;
    for(let r=0;r<ROWS;r++) if(b[r][centerCol]===AI) centerCount++;
    score += centerCount * 6;

    for(let r=0;r<ROWS;r++){
        const rowArray = b[r];
        for(let c=0;c<COLUMNS-3;c++){
            const window = rowArray.slice(c,c+4);
            score += scoreWindow(window);
        }
    }
    for(let c=0;c<COLUMNS;c++){
        for(let r=0;r<ROWS-3;r++){
            const window = [b[r][c],b[r+1][c],b[r+2][c],b[r+3][c]];
            score += scoreWindow(window);
        }
    }
    for(let r=0;r<ROWS-3;r++){
        for(let c=0;c<COLUMNS-3;c++){
            const window = [b[r][c],b[r+1][c+1],b[r+2][c+2],b[r+3][c+3]];
            score += scoreWindow(window);
        }
    }
    for(let r=3;r<ROWS;r++){
        for(let c=0;c<COLUMNS-3;c++){
            const window = [b[r][c],b[r-1][c+1],b[r-2][c+2],b[r-3][c+3]];
            score += scoreWindow(window);
        }
    }
    return score;
}

function scoreWindow(window){
    let score=0;
    const aiCount = window.filter(x=>x===AI).length;
    const playerCount = window.filter(x=>x===PLAYER).length;
    const emptyCount = window.filter(x=>x===0).length;

    if(aiCount===4) score += 100;
    else if(aiCount===3 && emptyCount===1) score += 6;
    else if(aiCount===2 && emptyCount===2) score += 2;

    if(playerCount===3 && emptyCount===1) score -= 8;
    if(playerCount===4) score -= 100;

    return score;
}

function updateAvatars() {
    const playerAvatar = document.querySelector('.player-info .avatar-image');
    const playerFallback = document.querySelector('.player-info .avatar-fallback');
    const aiAvatar = document.querySelector('.player-info.opponent .avatar-image');
    const aiFallback = document.querySelector('.player-info.opponent .avatar-fallback');
    
    if (playerAvatar) {
        playerAvatar.src = `assets/avatars/${settings.avatar}-avatar.png`;
        playerAvatar.onerror = function() {
            this.style.display = 'none';
            if (playerFallback) {
                playerFallback.textContent = settings.avatar === 'male' ? '♂' : '♀';
                playerFallback.style.display = 'flex';
            }
        };
        playerAvatar.onload = function() {
            this.style.display = 'block';
            if (playerFallback) playerFallback.style.display = 'none';
        };
    }
    
    if (aiAvatar) {
        aiAvatar.src = 'assets/avatars/ai-avatar.png';
        aiAvatar.onerror = function() {
            this.style.display = 'none';
            if (aiFallback) {
                aiFallback.textContent = 'AI';
                aiFallback.style.display = 'flex';
            }
        };
        aiAvatar.onload = function() {
            this.style.display = 'block';
            if (aiFallback) aiFallback.style.display = 'none';
        };
    }
}

function startNewGame(mode = 'single'){
    gameMode = mode;
    createBoard();
    clearWinHighlights();
    hideOverlay();
    renderBoard();
    
    if (mode === 'multiplayer') {
        currentPlayer = PLAYER1;
        document.getElementById('opponentName').textContent = multiplayerSessionStats.player2.name;
        document.getElementById('gameModeIndicator').textContent = 'Multiplayer';
    } else {
        isPlayerTurn = true;
        // Update player name if signed in with Farcaster
        if (userData) {
            document.querySelector('.player-info .player-name').textContent = userData.displayName;
        } else {
            document.querySelector('.player-info .player-name').textContent = 'You';
        }
        document.getElementById('opponentName').textContent = 'Computer';
        document.getElementById('gameModeIndicator').textContent = 'vs AI';
    }
    
    gameOver = false;
    updateWinCounters();
    updateGameStatus();
    showScreen('game');
}

function startMultiplayerGame() {
    startNewGame('multiplayer');
}

// Initialize game with authentication
function initGame() {
    console.log('🎮 Connect 4 MiniApp initializing...');
    
    try {
        loadGameStats();
        loadSettings();
        loadFarcasterUsers();
        
        // Load user data if available
        if (loadUserData()) {
            updateAuthUI();
        }
        
        updateAvatars();
        updateStreakDisplay();
        updateDashboardStreak();
        
        console.log('✅ Connect 4 MiniApp ready!');
        return true;
    } catch (error) {
        console.error('❌ Game initialization error:', error);
        return false;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', ()=>{
    // Initialize game
    initGame();
    
    // Dashboard buttons
    document.getElementById('newGameBtn').addEventListener('click', () => {
        startNewGame('single');
    });
    
    document.getElementById('multiplayerBtn').addEventListener('click', () => {
        startMultiplayerGame();
    });
    
    document.getElementById('leaderboardBtn').addEventListener('click', () => {
        updateLeaderboardDisplay();
        document.getElementById('leaderboardModal').classList.remove('hidden');
    });
    
    document.getElementById('dashboardSettingsBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('hidden');
    });
    
    // Authentication buttons
    document.getElementById('signInBtn').addEventListener('click', signIn);
    document.getElementById('signOutBtn').addEventListener('click', signOut);
    
    // Leaderboard tabs
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            
            document.querySelectorAll('.leaderboard-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            document.querySelectorAll('.leaderboard-list').forEach(list => list.classList.remove('active'));
            document.getElementById(tabName + 'Leaderboard').classList.add('active');
        });
    });
    
    // Back to dashboard from game
    document.getElementById('backToDashboardBtn').addEventListener('click', () => {
        showScreen('dashboard');
    });
    
    // Set difficulty
    const difficultySelect = document.getElementById('difficulty');
    if(difficultySelect){
        difficultySelect.value = difficulty;
        difficultySelect.addEventListener('change', (e)=>{
            difficulty = e.target.value;
        });
    }
    
    // Theme selector
    const themeSelect = document.getElementById('themeSelect');
    if(themeSelect){
        themeSelect.value = settings.theme;
        themeSelect.addEventListener('change', (e)=>{
            applyTheme(e.target.value);
        });
    }
    
    // Avatar selector
    const avatarSelect = document.getElementById('avatarSelect');
    if(avatarSelect){
        avatarSelect.value = settings.avatar;
        avatarSelect.addEventListener('change', (e)=>{
            settings.avatar = e.target.value;
            updateAvatars();
            saveSettings();
        });
    }
    
    // Sound toggle
    const soundToggle = document.getElementById('soundToggle');
    if(soundToggle){
        soundToggle.checked = settings.sound;
        soundToggle.addEventListener('change', (e)=>{
            settings.sound = e.target.checked;
            saveSettings();
        });
    }
    
    // Settings modal
    const settingsBtn = document.getElementById('dashboardSettingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    
    if(settingsModal) {
        closeSettingsBtn.addEventListener('click', ()=>{
            settingsModal.classList.add('hidden');
        });
    }
    
    // Help modal
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    
    if(helpBtn && helpModal) {
        helpBtn.addEventListener('click', ()=>{
            helpModal.classList.remove('hidden');
        });
        
        closeHelpBtn.addEventListener('click', ()=>{
            helpModal.classList.add('hidden');
        });
    }
    
    // Stats modal
    const statsBtn = document.getElementById('statsBtn');
    const statsModal = document.getElementById('statsModal');
    const closeStatsBtn = document.getElementById('closeStatsBtn');
    
    if(statsBtn && statsModal) {
        statsBtn.addEventListener('click', ()=>{
            updateStatsDisplay();
            statsModal.classList.remove('hidden');
        });
        
        closeStatsBtn.addEventListener('click', ()=>{
            statsModal.classList.add('hidden');
        });
    }
    
    // Leaderboard modal
    const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
    if(closeLeaderboardBtn) {
        closeLeaderboardBtn.addEventListener('click', () => {
            document.getElementById('leaderboardModal').classList.add('hidden');
        });
    }
    
    // Play Again button in overlay
    const overlayNewBtn = document.getElementById('overlayNew');
    if(overlayNewBtn) {
        overlayNewBtn.addEventListener('click', ()=>{
            startNewGame(gameMode);
        });
    }
    
    // Dashboard button in overlay
    const overlayDashboardBtn = document.getElementById('overlayDashboard');
    if(overlayDashboardBtn) {
        overlayDashboardBtn.addEventListener('click', ()=>{
            showScreen('dashboard');
        });
    }
    
    // Close modals when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
    
    // Show dashboard initially
    showScreen('dashboard');
});

// Handle window resize
let resizeTimer = null;
window.addEventListener('resize', ()=>{
    if(resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(()=>{
        if(currentWinPositions) highlightWinningPositions(currentWinPositions);
    }, 160);
});

// Make functions available globally
window.initGame = initGame;
window.__connect4 = {board, startNewGame, achievements, winStreak, showScreen, userData, signIn, signOut};
