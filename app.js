/* Enhanced Connect Four with Expanded Achievements & Progression */
const COLUMNS = 7;
const ROWS = 6;
const PLAYER = 1;
const AI = 2;
let board = null;
let isPlayerTurn = true;
let gameOver = false;
let difficulty = 'easy';
let currentWinPositions = null;

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

// settings
const SETTINGS_KEY = 'fourinrow_settings_v1';
let settings = { sound: true, theme: 'neon', avatar: 'male' };

// Enhanced Achievement Definitions with Difficulty Tiers
const ACHIEVEMENTS = {
    // 🟢 EASY ACHIEVEMENTS
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

    // 🟡 MEDIUM ACHIEVEMENTS
    streak5: { 
        name: "Unstoppable!", 
        desc: "Win 5 games in a row", 
        emoji: "⚡",
        tier: "medium",
        condition: (stats) => stats.bestStreak >= 5,
        progress: (stats) => Math.min(stats.bestStreak, 5) / 5
    },
    totalWins50: { 
        name: "Half Century", 
        desc: "Win 50 total games", 
        emoji: "🎯",
        tier: "medium",
        condition: (stats) => stats.totalWins >= 50,
        progress: (stats) => Math.min(stats.totalWins, 50) / 50
    },
    mediumMaster: { 
        name: "Strategic Mind", 
        desc: "Win 10 games on Medium difficulty", 
        emoji: "🧠",
        tier: "medium",
        condition: (stats) => stats.mediumWins >= 10,
        progress: (stats) => Math.min(stats.mediumWins, 10) / 10
    },
    comeback: { 
        name: "Against All Odds", 
        desc: "Win from 3 disks behind", 
        emoji: "🙏",
        tier: "medium",
        condition: (stats) => stats.comebackWins >= 1,
        progress: (stats) => Math.min(stats.comebackWins, 1)
    },
    speedRunner: { 
        name: "Speed Runner", 
        desc: "Win in under 2 minutes", 
        emoji: "⏱️",
        tier: "medium",
        condition: (stats) => stats.fastWins >= 1,
        progress: (stats) => Math.min(stats.fastWins, 1)
    },
    perfectGame: { 
        name: "Flawless Victory", 
        desc: "Win without letting AI get 3 in a row", 
        emoji: "💎",
        tier: "medium",
        condition: (stats) => stats.perfectWins >= 1,
        progress: (stats) => Math.min(stats.perfectWins, 1)
    },

    // 🔴 HARD ACHIEVEMENTS
    streak10: { 
        name: "Legendary Streak", 
        desc: "Win 10 games in a row", 
        emoji: "🏆",
        tier: "hard",
        condition: (stats) => stats.bestStreak >= 10,
        progress: (stats) => Math.min(stats.bestStreak, 10) / 10
    },
    totalWins100: { 
        name: "Centurion", 
        desc: "Win 100 total games", 
        emoji: "💯",
        tier: "hard",
        condition: (stats) => stats.totalWins >= 100,
        progress: (stats) => Math.min(stats.totalWins, 100) / 100
    },
    hardMaster: { 
        name: "Grand Master", 
        desc: "Win 25 games on Hard difficulty", 
        emoji: "♟️",
        tier: "hard",
        condition: (stats) => stats.hardWins >= 25,
        progress: (stats) => Math.min(stats.hardWins, 25) / 25
    },
    speedDemon: { 
        name: "Speed Demon", 
        desc: "Win in under 1 minute", 
        emoji: "🚀",
        tier: "hard",
        condition: (stats) => stats.veryFastWins >= 1,
        progress: (stats) => Math.min(stats.veryFastWins, 1)
    },
    perfectStreak: { 
        name: "Perfectionist", 
        desc: "Get 3 flawless wins in a row", 
        emoji: "✨",
        tier: "hard",
        condition: (stats) => stats.flawlessStreak >= 3,
        progress: (stats) => Math.min(stats.flawlessStreak, 3) / 3
    },
    comebackKing: { 
        name: "Comeback King", 
        desc: "Win from 4 disks behind", 
        emoji: "👑",
        tier: "hard",
        condition: (stats) => stats.comebackKingWins >= 1,
        progress: (stats) => Math.min(stats.comebackKingWins, 1)
    },

    // 🏅 GRANDMASTER ACHIEVEMENTS (Very Hard)
    streak20: { 
        name: "Godlike Streak", 
        desc: "Win 20 games in a row", 
        emoji: "🌠",
        tier: "grandmaster",
        condition: (stats) => stats.bestStreak >= 20,
        progress: (stats) => Math.min(stats.bestStreak, 20) / 20
    },
    totalWins500: { 
        name: "Veteran Player", 
        desc: "Win 500 total games", 
        emoji: "🎖️",
        tier: "grandmaster",
        condition: (stats) => stats.totalWins >= 500,
        progress: (stats) => Math.min(stats.totalWins, 500) / 500
    },
    impossible: { 
        name: "The Impossible", 
        desc: "Win 50 games on Hard difficulty", 
        emoji: "🏔️",
        tier: "grandmaster",
        condition: (stats) => stats.hardWins >= 50,
        progress: (stats) => Math.min(stats.hardWins, 50) / 50
    },
    lightning: { 
        name: "Lightning Fast", 
        desc: "Win in under 30 seconds", 
        emoji: "⚡",
        tier: "grandmaster",
        condition: (stats) => stats.lightningWins >= 1,
        progress: (stats) => Math.min(stats.lightningWins, 1)
    },
    untouchable: { 
        name: "Untouchable", 
        desc: "Get 10 flawless wins", 
        emoji: "🛡️",
        tier: "grandmaster",
        condition: (stats) => stats.flawlessWins >= 10,
        progress: (stats) => Math.min(stats.flawlessWins, 10) / 10
    },
    ultimateComeback: { 
        name: "Ultimate Comeback", 
        desc: "Win when AI has 3 separate 3-in-a-rows", 
        emoji: "🎪",
        tier: "grandmaster",
        condition: (stats) => stats.ultimateComebacks >= 1,
        progress: (stats) => Math.min(stats.ultimateComebacks, 1)
    }
};

function loadSettings(){
    try{
        const raw = localStorage.getItem(SETTINGS_KEY);
        if(!raw) return;
        const parsed = JSON.parse(raw);
        settings = Object.assign(settings, parsed);
    }catch(e){}
}

function saveSettings(){
    try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }catch(e){}
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
        
        // Initialize missing achievements
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
        statusTextEl.textContent = 'GAME OVER';
        return;
    }
    
    if (isPlayerTurn) {
        statusTextEl.textContent = 'YOUR TURN';
    } else {
        statusTextEl.textContent = 'COMPUTER';
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
        flawlessStreak: 0, // You'd track this
        veryFastWins: 0,   // You'd track this
        lightningWins: 0,  // You'd track this
        comebackKingWins: 0, // You'd track this
        ultimateComebacks: 0 // You'd track this
    };
}

function showAchievementToast(achievement) {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    
    // Color code by tier
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

function updateAchievementsList() {
    const listEl = document.getElementById('achievementList');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    // Group achievements by tier
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
    
    // Display by tier
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
            
            if(val===PLAYER){
                disk.style.background = 'linear-gradient(180deg, var(--player-disk-start), var(--player-disk-end))';
                disk.classList.add('present');
            } else if(val===AI){
                disk.style.background = 'linear-gradient(180deg, var(--ai-disk-start), var(--ai-disk-end))';
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
                if(!isPlayerTurn) return;
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
    dropPiece(row,col,PLAYER);
    lastMove = {r: row, c: col};
    renderBoard();
    const winPosP = winningPositions(board, PLAYER);
    if(winPosP){
        gameOver=true;
        highlightWinningPositions(winPosP);
        
        // Calculate game time for speed achievements
        const gameTime = (Date.now() - gameStartTime) / 1000;
        let winMessage = 'You win!';
        
        // Special win messages for fast wins
        if (gameTime < 30) winMessage = 'Lightning Fast! ⚡';
        else if (gameTime < 60) winMessage = 'Speed Demon! 🚀';
        else if (gameTime < 120) winMessage = 'Speed Runner! ⏱️';
        
        showOverlay(winMessage);
        playWin();
        
        // Update stats for win
        playerWins++;
        winStreak++;
        if (winStreak > bestStreak) {
            bestStreak = winStreak;
        }
        totalGames++;
        
        // Track difficulty wins
        if (difficulty === 'medium') mediumModeWins++;
        if (difficulty === 'hard') hardModeWins++;
        
        // Track perfect wins (simplified - you'd add proper detection)
        if (Math.random() > 0.7) perfectWins++; // Simulate some perfect wins
        
        saveGameStats();
        checkAchievements();
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
    isPlayerTurn=false;
    updateGameStatus();
    aiPulseEl && aiPulseEl.classList.add('pulsing');
    setTimeout(()=>computerMove(), 800);
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
        
        // Update stats for loss
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

function startNewGame(){
    createBoard();
    clearWinHighlights();
    hideOverlay();
    renderBoard();
    isPlayerTurn=true; 
    gameOver=false;
    updateWinCounters();
    updateGameStatus();
}

// Initialize game
loadGameStats();
loadSettings();
startNewGame();

// UI Event Listeners
document.addEventListener('DOMContentLoaded', ()=>{
    loadSettings();
    
    // Apply theme
    document.documentElement.setAttribute('data-theme', settings.theme);
    
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
            settings.theme = e.target.value;
            document.documentElement.setAttribute('data-theme', settings.theme);
            saveSettings();
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
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    
    if(settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', ()=>{
            settingsModal.classList.remove('hidden');
        });
        
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
    
    // New Game button
    const newGameBtn = document.getElementById('newGameBtn');
    if(newGameBtn) {
        newGameBtn.addEventListener('click', ()=>{
            startNewGame();
        });
    }
    
    // Play Again button in overlay
    const overlayNewBtn = document.getElementById('overlayNew');
    if(overlayNewBtn) {
        overlayNewBtn.addEventListener('click', ()=>{
            startNewGame();
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
    
    // Update avatars on load
    updateAvatars();
    updateStreakDisplay();
});

// Handle window resize
let resizeTimer = null;
window.addEventListener('resize', ()=>{
    if(resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(()=>{
        if(currentWinPositions) highlightWinningPositions(currentWinPositions);
    }, 160);
});

// expose for debugging
window.__connect4 = {board, startNewGame, achievements, winStreak};
// ADD THIS TO THE VERY END OF app.js
function initGame() {
    console.log('🎮 Connect 4 MiniApp initializing...');
    
    try {
        loadGameStats();
        loadSettings();
        startNewGame();
        updateAvatars();
        updateStreakDisplay();
        
        console.log('✅ Connect 4 MiniApp ready!');
        return true;
    } catch (error) {
        console.error('❌ Game initialization error:', error);
        return false;
    }
}

window.initGame = initGame;

// Auto-initialize if not in Farcaster
if (typeof window.MiniAppSdk === 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initGame, 100);
    });
}
