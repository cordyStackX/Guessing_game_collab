class Achievement {
    constructor(id, name, description, condition) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.condition = condition;
        this.unlocked = false;
    }

    check(gameData) {
        if (!this.unlocked && this.condition(gameData)) {
            this.unlocked = true;
            return true;
        }
        return false;
    }
}

class AchievementManager {
    constructor() {
        this.achievements = [
            new Achievement('first_win', 'First Victoryyyyy!', 'Na solbar mona dayon ang una gha ba!', 
                data => data.correctWords >= 1),
            new Achievement('streak_3', 'Triple SHOOTTT!', 'Tatlo ka sunod-sunod nga daog gha ba!', 
                data => data.currentStreak >= 3),
            new Achievement('speed_demon', 'Speeda gid!', 'Nasolusyonan mo sang maayo gha!', 
                data => data.lastSolveTime <= 5),
            new Achievement('high_score', 'Academic Achieverrrrr!', 'Grabe gid ya imo puntos gha!', 
                data => data.score >= 1000),
            new Achievement('perfect_game', 'Perfectionistaaa!', 'Wala gid ka nag-skip kag ga click nag-hint! Believe ko simo ah!', 
                data => data.hintsUsed === 0 && data.skipsUsed === 0 && data.wordsCompleted >= 10)
        ];
    }

    checkAchievements(gameData) {
        const newAchievements = [];
        this.achievements.forEach(achievement => {
            if (achievement.check(gameData)) {
                newAchievements.push(achievement);
                this.showAchievement(achievement);
            }
        });
        return newAchievements;
    }

    showAchievement(achievement) {
        const popup = document.getElementById('achievementPopup');
        const text = document.getElementById('achievementText');
        text.innerHTML = `<strong>${achievement.name}</strong><br>${achievement.description}`;
        popup.classList.add('show');
        setTimeout(() => popup.classList.remove('show'), 3000);
    }

    reset() {
        this.achievements.forEach(achievement => {
            achievement.unlocked = false;
        });
    }
}

class GameTimer {
    constructor(initialTime, onUpdate, onExpire) {
        this.timeRemaining = initialTime;
        this.onUpdate = onUpdate;
        this.onExpire = onExpire;
        this.interval = null;
        this.isRunning = false;
        this.isPaused = false;
    }

    start() {
        if (this.isRunning && !this.isPaused) return;
        this.isRunning = true;
        this.isPaused = false;
        this.interval = setInterval(() => {
            if (!this.isPaused) {
                this.timeRemaining--;
                this.onUpdate(this.timeRemaining);
                
                if (this.timeRemaining <= 0) {
                    this.stop();
                    this.onExpire();
                }
            }
        }, 1000);
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            this.isRunning = false;
            this.isPaused = false;
        }
    }

    addTime(seconds) {
        this.timeRemaining += seconds;
    }

    reset(newTime) {
        this.stop();
        this.timeRemaining = newTime;
    }
}

class WordItem {
    constructor(answer, clue, category, trivia, difficulty = 1) {
        this.answer = answer.toLowerCase();
        this.mixedUp = this.shuffle(answer);
        this.clue = clue;
        this.category = category;
        this.trivia = trivia;
        this.difficulty = difficulty;
        this.revealedLetters = new Set();
        this.firstLetterRevealed = false;
    }
    
    shuffle(word) {
        let chars = word.toLowerCase().split('');
        for (let i = chars.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        return chars.join('').toUpperCase();
    }
    
    isCorrect(guess) {
        return guess.toLowerCase().trim() === this.answer;
    }
    
    revealFirstLetter() {
        if (!this.firstLetterRevealed) {
            this.firstLetterRevealed = true;
            return true;
        }
        return false;
    }

    getDisplayWord() {
        let display = '';
        for (let i = 0; i < this.answer.length; i++) {
            if (this.revealedLetters.has(i)) {
                display += `<span class="letter-reveal">${this.answer[i].toUpperCase()}</span>`;
            } else if (i < this.mixedUp.length) {
                display += this.mixedUp[i];
            }
        }
        return display;
    }

    getFirstLetterHint() {
        if (this.firstLetterRevealed) {
            return `First letter: ${this.answer[0].toUpperCase()}`;
        }
        return '';
    }
}

class PowerUp {
    constructor(name, maxUses, action) {
        this.name = name;
        this.maxUses = maxUses;
        this.remainingUses = maxUses;
        this.action = action;
    }

    use(game) {
        if (this.remainingUses > 0) {
            this.remainingUses--;
            return this.action(game);
        }
        return false;
    }

    canUse() {
        return this.remainingUses > 0;
    }

    reset() {
        this.remainingUses = this.maxUses;
    }
}

class WordScrambleGame {
    constructor() {
        this.score = 0;
        this.round = 1;
        this.currentWord = null;
        this.status = 'waiting';
        this.wordsComplete = 0;
        this.correctWords = 0;
        this.incorrectAttempts = 0;
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.hintsUsed = 0;
        this.skipsUsed = 0;
        this.totalAttempts = 0;
        this.lastSolveTime = 0;
        this.roundStartTime = 0;
        
        this.achievementManager = new AchievementManager();
        this.timer = new GameTimer(30, 
            (timeLeft) => this.updateTimerDisplay(timeLeft),
            () => this.handleTimeUp()
        );
        
        this.setupPowerUps();
        this.setupEventListeners();
        this.loadWordDatabase();
    }
    
    setupPowerUps() {
        this.powerUps = {
            firstLetter: new PowerUp('First Letter', 3, (game) => game.revealFirstLetter()),
            skip: new PowerUp('Skip Word', 3, (game) => game.skipCurrentWord()),
            time: new PowerUp('Extra Time', 2, (game) => game.addExtraTime())
        };
    }
    
    setupEventListeners() {
        const answerBox = document.getElementById('answerBox');
        
        answerBox.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitGuess();
            }
        });
        
        answerBox.addEventListener('input', () => {
            answerBox.classList.remove('correct', 'incorrect', 'incorrect-shake');
        });
    }
    
    loadWordDatabase() {
        this.wordDatabase = [
            new WordItem('BANANA', 'Yellow fruit na gid ka sweet', 'Food', 'Bananas are berries, pero ang strawberries indi berries!', 1),
            new WordItem('COMPUTER', 'Electronic gadget para sa trabaho kag games', 'Technology', 'Ang first computer bug literal nga bug - insect na na-stuck sa machine!', 2),
            new WordItem('UMBRELLA', 'Gamit sa ulan kag init', 'Objects', 'Ang umbrella ginggamit sa may 4,000 years na sa Egypt!', 2),
            new WordItem('BUTTERFLY', 'Colorful insect na nag-fly', 'Animals', 'Butterflies taste with their feet kag smell with their antennae!', 3),
            new WordItem('CHOCOLATE', 'Sweet treat na favorite sang tanan', 'Food', 'Chocolate kay mas effective pa sa cough syrup para sa ubo!', 2),
            new WordItem('RAINBOW', 'Makita sa langit pagkatapos sang ulan', 'Nature', 'Double rainbows happen when light bounces twice inside raindrops!', 2),
            new WordItem('ELEPHANT', 'Largest land animal', 'Animals', 'Elephants can remember faces kag recognize themselves sa mirror!', 3),
            new WordItem('GUITAR', 'Musical instrument na may strings', 'Music', 'Ang oldest guitar found kay 3,500 years old na gani!', 2),
            new WordItem('LIBRARY', 'Place full of books', 'Places', 'Library of Alexandria kay may estimated 700,000 scrolls!', 2),
            new WordItem('SANDWICH', 'Food between two breads', 'Food', 'Sandwich gin-invent sang Earl of Sandwich para indi maka-tigil sa card games!', 2),
            new WordItem('KEYBOARD', 'Input device para sa computer', 'Technology', 'QWERTY layout gin-design para ma-slow down ang typing sa typewriters!', 2),
            new WordItem('MOUNTAIN', 'Very high landform', 'Nature', 'Mount Everest naga-grow pa gid by 4mm each year!', 2),
            new WordItem('TELEPHONE', 'Device para sa pag-call', 'Technology', 'First words sa telephone kay "Mr. Watson, come here!"', 3),
            new WordItem('CALENDAR', 'Shows dates kag months', 'Objects', 'Gregorian calendar kay may error of 26 seconds per year!', 2),
            new WordItem('VOLCANO', 'Mountain na may lava', 'Nature', 'May over 1,500 active volcanoes worldwide!', 2),
            new WordItem('DINOSAUR', 'Extinct giant reptiles', 'Animals', 'Dinosaurs lived on Earth for 165 million years!', 3),
            new WordItem('TREASURE', 'Hidden valuable things', 'Objects', 'Pirate treasure maps were mostly fictional inventions!', 2),
            new WordItem('HOSPITAL', 'Place para sa medical care', 'Places', 'First hospitals were established sa monasteries!', 2),
            new WordItem('AIRPLANE', 'Flying vehicle', 'Transportation', 'Wright brothers first flight lasted lang 12 seconds!', 2),
            new WordItem('INTERNET', 'Global network of computers', 'Technology', 'First message sa internet kay "LOGIN" pero nag-crash after "LO"!', 2)
        ];
    }
    
    startNewGame() {
        this.resetGameStats();
        this.achievementManager.reset();
        this.resetPowerUps();
        this.shuffleWordDatabase();
        this.showGameView();
        this.nextWord();
    }
    
    resetGameStats() {
        this.score = 0;
        this.round = 1;
        this.wordsCompleted = 0;
        this.correctWords = 0;
        this.incorrectAttempts = 0;
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.hintsUsed = 0;
        this.skipsUsed = 0;
        this.totalAttempts = 0;
        this.lastSolveTime = 0;
        this.status = 'playing';
    }
    
    resetPowerUps() {
        Object.values(this.powerUps).forEach(powerUp => powerUp.reset());
        this.updatePowerUpDisplay();
    }
    
    shuffleWordDatabase() {
        for (let i = this.wordDatabase.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.wordDatabase[i], this.wordDatabase[j]] = [this.wordDatabase[j], this.wordDatabase[i]];
        }
    }
    
    nextWord() {
        if (this.round > this.wordDatabase.length) {
            this.endGame();
            return;
        }
        
        this.currentWord = this.wordDatabase[this.round - 1];
        this.roundStartTime = Date.now();
        this.timer.reset(30);
        this.timer.start();
        this.displayCurrentWord();
        this.updateGameDisplay();
        this.clearInput(); 
    }
    
    displayCurrentWord() {
        document.getElementById('scrambledLetters').innerHTML = this.currentWord.getDisplayWord();
        document.getElementById('wordClue').textContent = this.currentWord.clue;
        document.getElementById('wordCategory').textContent = this.currentWord.category;
        
        const firstLetterHint = document.getElementById('firstLetterHint');
        firstLetterHint.style.display = 'none';
        firstLetterHint.textContent = '';
    }
    
    clearInput() {
        const answerBox = document.getElementById('answerBox');
        answerBox.value = '';
        answerBox.classList.remove('correct', 'incorrect', 'incorrect-shake');
        answerBox.focus(); 
    }
    
    submitGuess() {
        if (this.status !== 'playing') return;
        
        const guess = document.getElementById('answerBox').value.trim();
        if (!guess) return;
        
        this.totalAttempts++;
        
        if (this.currentWord.isCorrect(guess)) {
            this.handleCorrectAnswer();
        } else {
            this.handleIncorrectAnswer();
        }
    }
    
    handleCorrectAnswer() {
        this.timer.stop();
        const timeTaken = Math.floor((Date.now() - this.roundStartTime) / 1000);
        this.lastSolveTime = timeTaken;
        
        this.correctWords++;
        this.wordsCompleted++;
        this.currentStreak++;
        this.bestStreak = Math.max(this.bestStreak, this.currentStreak);
        
        const baseScore = 100 * this.currentWord.difficulty;
        const timeBonus = Math.max(0, (30 - timeTaken) * 5);
        const streakBonus = this.currentStreak > 1 ? this.currentStreak * 10 : 0;
        const totalScore = baseScore + timeBonus + streakBonus;
        
        this.score += totalScore;
        this.showScorePopup(totalScore);
        this.showCorrectFeedback();
        
        this.achievementManager.checkAchievements(this.getGameData());
        
        setTimeout(() => {
            this.showTriviaModal();
        }, 1500);
    }
    
    handleIncorrectAnswer() {
        this.incorrectAttempts++;
        this.currentStreak = 0;
        this.showIncorrectFeedback();
        this.clearInput(); 
    }
    
    showCorrectFeedback() {
        const answerBox = document.getElementById('answerBox');
        answerBox.classList.add('correct');
        answerBox.value = this.currentWord.answer.toUpperCase();
        
        document.querySelector('.game-wrapper').classList.add('success-animation');
        setTimeout(() => {
            document.querySelector('.game-wrapper').classList.remove('success-animation');
        }, 800);
    }
    
    showIncorrectFeedback() {
        const answerBox = document.getElementById('answerBox');
        answerBox.classList.add('incorrect', 'incorrect-shake');
        
        setTimeout(() => {
            answerBox.classList.remove('incorrect-shake');
        }, 500);
    }
    
    showScorePopup(points) {
        const popup = document.getElementById('scorePopup');
        document.getElementById('scoreAmount').textContent = points;
        popup.classList.add('show');
        
        setTimeout(() => {
            popup.classList.remove('show');
        }, 2000);
    }
    
    revealFirstLetter() {
        if (this.currentWord && this.currentWord.revealFirstLetter()) {
            this.hintsUsed++;
            
            const firstLetterHint = document.getElementById('firstLetterHint');
            firstLetterHint.textContent = this.currentWord.getFirstLetterHint();
            firstLetterHint.style.display = 'block';
            
            document.getElementById('scrambledLetters').innerHTML = this.currentWord.getDisplayWord();
            
            return true;
        }
        return false;
    }
    
    skipCurrentWord() {
        this.skipsUsed++;
        this.currentStreak = 0;
        this.timer.stop();
        
        const answerBox = document.getElementById('answerBox');
        answerBox.value = `Answer: ${this.currentWord.answer.toUpperCase()}`;
        answerBox.classList.add('correct');
        
        setTimeout(() => {
            this.nextRound();
        }, 2000);
        
        return true;
    }
    
    addExtraTime() {
        this.timer.addTime(10);
        this.updateTimerDisplay(this.timer.timeRemaining);
        return true;
    }
    
    nextRound() {
        this.round++;
        this.nextWord();
    }
    
    handleTimeUp() {
        this.currentStreak = 0;
        const answerBox = document.getElementById('answerBox');
        answerBox.value = `Time's up! Answer: ${this.currentWord.answer.toUpperCase()}`;
        answerBox.classList.add('incorrect');
        
        setTimeout(() => {
            if (this.round >= this.wordDatabase.length) {
                this.endGame();
            } else {
                this.nextRound();
            }
        }, 2000);
    }
    
    updateGameDisplay() {
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('levelBar').style.width = `${(this.round / this.wordDatabase.length) * 100}%`;
        this.updatePowerUpDisplay();
    }
    
    updatePowerUpDisplay() {
        document.getElementById('firstLetterCount').textContent = this.powerUps.firstLetter.remainingUses;
        document.getElementById('skipCount').textContent = this.powerUps.skip.remainingUses;
        document.getElementById('timeCount').textContent = this.powerUps.time.remainingUses;
        
        document.getElementById('firstLetterBtn').disabled = !this.powerUps.firstLetter.canUse();
        document.getElementById('skipBtn').disabled = !this.powerUps.skip.canUse();
        document.getElementById('timeBtn').disabled = !this.powerUps.time.canUse();
    }
    
    updateTimerDisplay(timeLeft) {
        const timeDisplay = document.getElementById('timeLeft');
        timeDisplay.textContent = timeLeft;
        
        if (timeLeft <= 5) {
            timeDisplay.classList.add('warning-state');
        } else {
            timeDisplay.classList.remove('warning-state');
        }
    }
    
    showTriviaModal() {
        const modal = document.getElementById('triviaModal');
        const triviaText = document.getElementById('triviaText');
        triviaText.textContent = this.currentWord.trivia;
        modal.classList.add('show');
    }
    
    closeTriviaModal() {
        document.getElementById('triviaModal').classList.remove('show');
        setTimeout(() => {
            if (this.round >= this.wordDatabase.length) {
                this.endGame();
            } else {
                this.nextRound();
            }
        }, 300);
    }
    
    endGame() {
        this.status = 'finished';
        this.timer.stop();
        this.showEndScreen();
    }
    
    showEndScreen() {
        this.hideGameView();
        this.displayFinalStats();
        this.displayAchievements();
        document.getElementById('endView').classList.add('active');
    }
    
    displayFinalStats() {
        const accuracy = this.totalAttempts > 0 ? Math.round((this.correctWords / this.totalAttempts) * 100) : 0;
        
        document.getElementById('totalScore').textContent = this.score;
        document.getElementById('wordsCompletedStat').textContent = this.correctWords;
        document.getElementById('bestStreakStat').textContent = this.bestStreak;
        document.getElementById('accuracyStat').textContent = `${accuracy}%`;
        
        let message = '';
        if (this.score >= 2000) {
            message = 'Outstanding performance!';
        } else if (this.score >= 1500) {
            message = 'Excellent work!';
        } else if (this.score >= 1000) {
            message = 'Well done!';
        } else if (this.score >= 500) {
            message = 'Good effort!';
        } else {
            message = 'Nice try!';
        }
        
        document.getElementById('resultMessage').textContent = message;
    }
    
    displayAchievements() {
        const achievementsList = document.getElementById('achievementsList');
        const unlockedAchievements = this.achievementManager.achievements.filter(a => a.unlocked);
        
        if (unlockedAchievements.length > 0) {
            achievementsList.innerHTML = '<h3>🏅 Achievements Unlocked</h3>';
            unlockedAchievements.forEach(achievement => {
                const div = document.createElement('div');
                div.className = 'achievement-item';
                div.innerHTML = `<strong>${achievement.name}</strong> - ${achievement.description}`;
                achievementsList.appendChild(div);
            });
            achievementsList.style.display = 'block';
        } else {
            achievementsList.style.display = 'none';
        }
    }
    
    getGameData() {
        return {
            score: this.score,
            correctWords: this.correctWords,
            currentStreak: this.currentStreak,
            bestStreak: this.bestStreak,
            wordsCompleted: this.wordsCompleted,
            hintsUsed: this.hintsUsed,
            skipsUsed: this.skipsUsed,
            lastSolveTime: this.lastSolveTime,
            totalAttempts: this.totalAttempts
        };
    }
    
    showGameView() {
        document.getElementById('homeView').classList.remove('active');
        document.getElementById('endView').classList.remove('active');
        document.getElementById('playView').classList.add('active');
    }
    
    hideGameView() {
        document.getElementById('playView').classList.remove('active');
    }
    
    restartFromBeginning() {
        document.getElementById('endView').classList.remove('active');
        document.getElementById('homeView').classList.add('active');
    }
}

let game;

function startNewGame() {
    if (!game) {
        game = new WordScrambleGame();
    }
    game.startNewGame();
}

function submitGuess() {
    if (game) {
        game.submitGuess();
    }
}

function useHelper(type) {
    if (game && game.status === 'playing') {
        const powerUp = game.powerUps[type];
        if (powerUp && powerUp.canUse()) {
            if (powerUp.use(game)) {
                game.updatePowerUpDisplay();
            }
        }
    }
}

function closeTriviaModal() {
    if (game) {
        game.closeTriviaModal();
    }
}

function restartFromBeginning() {
    if (game) {
        game.restartFromBeginning();
    }
}

document.addEventListener('DOMContentLoaded', function() {
});