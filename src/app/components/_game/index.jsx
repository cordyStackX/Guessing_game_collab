

export default function InGame() {

    return(
        <>
            <div className="game-container">
                <div className="game-wrapper"> 
                    <div className="start-screen active" id="homeView">
                        <h1>Word Scramble Game</h1>
                        <p>Mahampang nata and let us have a fun taya gha! </p>
                        <button className="glass-btn" onClick={() => startNewGame()}>Start Game</button>
                    </div>

                    <div className="game-content" id="playView">
                        <div className="status-row">
                            <div className="score-info">Score: <span id="scoreValue">0</span></div>
                            <div className="category-chip" id="wordCategory">Loading...</div>
                            <div className="time-display" id="timeLeft">30</div>
                        </div>

                        <div className="level-progress">
                            <div className="progress-indicator" id="levelBar"></div>
                        </div>

                        <div className="word-section">
                            <div className="jumbled-text" id="scrambledLetters">PREPARING...</div>
                            <img className="word-image" id="wordImage" alt="Word hint image" />
                            <div className="clue-container">
                                <span id="wordClue">Getting ready to start...</span>
                            </div>
                            <div className="first-letter-hint" id="firstLetterHint"></div>
                            <input type="text" className="input-field" id="answerBox" placeholder="Enter your guess" autoComplete="off" spellCheck="false" />
                        </div>

                        <div className="tools-section">
                            <button className="tool-button" id="firstLetterBtn" onClick={() => useHelper('firstLetter')}>
                                First Letter <span className="tool-badge" id="firstLetterCount">3</span>
                            </button>
                            <button className="tool-button" id="skipBtn" onClick={() => useHelper('skip')}>
                                Skip Word <span className="tool-badge" id="skipCount">3</span>
                            </button>
                            <button className="tool-button" id="timeBtn" onClick={() => useHelper('time')}>
                                +10 Seconds <span className="tool-badge" id="timeCount">2</span>
                            </button>
                        </div>

                        <button className="glass-btn submit-btn" onClick={() => submitGuess()}>Submit Answer</button>
                    </div>

                    <div className="finish-screen" id="endView">
                        <h2>Game Complete!</h2>
                        
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-value" id="totalScore">0</span>
                                <span className="stat-label">Final Score</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value" id="wordsCompletedStat">0</span>
                                <span className="stat-label">Words Solved</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value" id="bestStreakStat">0</span>
                                <span className="stat-label">Best Streak</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value" id="accuracyStat">0%</span>
                                <span className="stat-label">Accuracy</span>
                            </div>
                        </div>

                        <div className="finish-message" id="resultMessage">Excellent work! You've completed the challenge.</div>
                        
                        <div id="achievementsList" className="achievements-section"></div>
                        
                        <button className="glass-btn" onClick={() => restartFromBeginning()}>Play Again</button>
                    </div>
                </div> 
            </div>

            <div className="trivia-modal" id="triviaModal">
                <div className="trivia-content">
                    <h3>Did you know?</h3>
                    <p id="triviaText">Interesting fact will appear here...</p>
                    <button className="continue-btn" onClick={() => closeTriviaModal()}>Continue Game</button>
                </div>
            </div>

            <div className="achievement-popup" id="achievementPopup">
                <div id="achievementText"></div>
            </div>

            <div className="score-popup" id="scorePopup">
                +<span id="scoreAmount">0</span> points!
            </div>
        </>
    );

}