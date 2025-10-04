import { useEffect } from 'react';
import { useWordScrambleGame } from '../../modules/_game_logic/gameHooks';

export default function InGame() {
    const {
        gameState,
        timer,
        achievementManager,
        powerUps,
        startNewGame,
        submitGuess,
        useHelper,
        closeTriviaModal,
        restartFromBeginning,
        updateUserInput
    } = useWordScrambleGame();

    // Handle keyboard events
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'Enter' && gameState.status === 'playing') {
                submitGuess();
            }
        };

        document.addEventListener('keypress', handleKeyPress);
        return () => document.removeEventListener('keypress', handleKeyPress);
    }, [submitGuess, gameState.status]);

    // Calculate progress percentage
    const progressPercentage = gameState.round > 0 ? (gameState.round / 20) * 100 : 0;
    
    // Calculate accuracy
    const accuracy = gameState.totalAttempts > 0 
        ? Math.round((gameState.correctWords / gameState.totalAttempts) * 100) 
        : 0;

    // Get final message based on score
    const getFinalMessage = () => {
        if (gameState.score >= 2000) return 'Outstanding performance!';
        if (gameState.score >= 1500) return 'Excellent work!';
        if (gameState.score >= 1000) return 'Well done!';
        if (gameState.score >= 500) return 'Good effort!';
        return 'Nice try!';
    };

    return (
        <>
            <div className="game-container">
                <div className={`game-wrapper ${gameState.inputState === 'correct' ? 'success-animation' : ''}`}> 
                    {/* Home Screen */}
                    <div className={`start-screen ${gameState.currentView === 'home' ? 'active' : ''}`}>
                        <h1>Word Scramble Game</h1>
                        <p>Mahampang nata and let us have a fun taya gha! </p>
                        <button className="glass-btn" onClick={startNewGame}>Start Game</button>
                    </div>

                    {/* Game Play Screen */}
                    <div className={`game-content ${gameState.currentView === 'play' ? 'active' : ''}`}>
                        <div className="status-row">
                            <div className="score-info">Score: <span>{gameState.score}</span></div>
                            <div className="category-chip">{gameState.currentWord?.category || 'Loading...'}</div>
                            <div className={`time-display ${timer.timeRemaining <= 5 ? 'warning-state' : ''}`}>
                                {timer.timeRemaining}
                            </div>
                        </div>

                        <div className="level-progress">
                            <div className="progress-indicator" style={{ width: `${progressPercentage}%` }}></div>
                        </div>

                        <div className="word-section">
                            <div 
                                className="jumbled-text" 
                                dangerouslySetInnerHTML={{ 
                                    __html: gameState.currentWord?.getDisplayWord() || 'PREPARING...' 
                                }}
                            />
                            <img className="word-image" alt="Word hint image" />
                            <div className="clue-container">
                                <span>{gameState.currentWord?.clue || 'Getting ready to start...'}</span>
                            </div>
                            {gameState.firstLetterHint && (
                                <div className="first-letter-hint" style={{ display: 'block' }}>
                                    {gameState.firstLetterHint}
                                </div>
                            )}
                            <input 
                                type="text" 
                                className={`input-field ${gameState.inputState} ${gameState.inputState === 'incorrect' ? 'incorrect-shake' : ''}`}
                                value={gameState.userInput}
                                onChange={(e) => updateUserInput(e.target.value)}
                                placeholder="Enter your guess" 
                                autoComplete="off" 
                                spellCheck="false"
                                disabled={gameState.status !== 'playing'}
                            />
                        </div>

                        <div className="tools-section">
                            <button 
                                className="tool-button" 
                                onClick={() => useHelper('firstLetter')}
                                disabled={!powerUps.firstLetter?.canUse()}
                            >
                                First Letter <span className="tool-badge">{powerUps.firstLetter?.remainingUses || 0}</span>
                            </button>
                            <button 
                                className="tool-button" 
                                onClick={() => useHelper('skip')}
                                disabled={!powerUps.skip?.canUse()}
                            >
                                Skip Word <span className="tool-badge">{powerUps.skip?.remainingUses || 0}</span>
                            </button>
                            <button 
                                className="tool-button" 
                                onClick={() => useHelper('time')}
                                disabled={!powerUps.time?.canUse()}
                            >
                                +10 Seconds <span className="tool-badge">{powerUps.time?.remainingUses || 0}</span>
                            </button>
                        </div>

                        <button 
                            className="glass-btn submit-btn" 
                            onClick={submitGuess}
                            disabled={gameState.status !== 'playing'}
                        >
                            Submit Answer
                        </button>
                    </div>

                    {/* End Game Screen */}
                    <div className={`finish-screen ${gameState.currentView === 'end' ? 'active' : ''}`}>
                        <h2>Game Complete!</h2>
                        
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-value">{gameState.score}</span>
                                <span className="stat-label">Final Score</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value">{gameState.correctWords}</span>
                                <span className="stat-label">Words Solved</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value">{gameState.bestStreak}</span>
                                <span className="stat-label">Best Streak</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value">{accuracy}%</span>
                                <span className="stat-label">Accuracy</span>
                            </div>
                        </div>

                        <div className="finish-message">{getFinalMessage()}</div>
                        
                        {achievementManager.achievements.filter(a => a.unlocked).length > 0 && (
                            <div className="achievements-section">
                                <h3>🏅 Achievements Unlocked</h3>
                                {achievementManager.achievements
                                    .filter(achievement => achievement.unlocked)
                                    .map(achievement => (
                                        <div key={achievement.id} className="achievement-item">
                                            <strong>{achievement.name}</strong> - {achievement.description}
                                        </div>
                                    ))}
                            </div>
                        )}
                        
                        <button className="glass-btn" onClick={restartFromBeginning}>Play Again</button>
                    </div>
                </div> 
            </div>

            {/* Trivia Modal */}
            <div className={`trivia-modal ${gameState.showTrivia ? 'show' : ''}`}>
                <div className="trivia-content">
                    <h3>Did you know?</h3>
                    <p>{gameState.currentWord?.trivia || 'Interesting fact will appear here...'}</p>
                    <button className="continue-btn" onClick={closeTriviaModal}>Continue Game</button>
                </div>
            </div>

            {/* Achievement Popup */}
            {achievementManager.newAchievements.length > 0 && (
                <div className="achievement-popup show">
                    <div>
                        {achievementManager.newAchievements.map(achievement => (
                            <div key={achievement.id}>
                                <strong>{achievement.name}</strong><br/>
                                {achievement.description}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Score Popup */}
            <div className={`score-popup ${gameState.scorePopup.show ? 'show' : ''}`}>
                +<span>{gameState.scorePopup.amount}</span> points!
            </div>
        </>
    );
}