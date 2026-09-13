// Aviator Predictor - Main Logic
class AviatorPredictor {
    constructor() {
        this.predictionHistory = [];
        this.roundNumber = 1;
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.loadHistoryFromStorage();
        this.updateStats();
    }

    attachEventListeners() {
        const predictBtn = document.getElementById('predictBtn');
        predictBtn.addEventListener('click', () => this.generatePrediction());
    }

    generatePrediction() {
        const lastRoundsInput = document.getElementById('lastRounds').value;
        const timeOfDay = document.getElementById('timeOfDay').value;

        if (!lastRoundsInput.trim()) {
            alert('Please enter the last 5 rounds multipliers');
            return;
        }

        const rounds = this.parseRounds(lastRoundsInput);

        if (rounds.length < 3) {
            alert('Please enter at least 3 previous round multipliers');
            return;
        }

        const prediction = this.calculatePrediction(rounds, timeOfDay);
        const flightDuration = 3000;

        // Hide previous result and fly the plane while analyzing
        document.getElementById('predictionResult').classList.add('hidden');
        this.startFlight(parseFloat(prediction.predictedMultiplier), flightDuration);

        setTimeout(() => {
            this.displayPrediction(prediction);
        }, flightDuration);
    }

    startFlight(targetMultiplier, duration) {
        const plane = document.getElementById('plane');
        const flightMultiplier = document.getElementById('flightMultiplier');
        const flightStatus = document.getElementById('flightStatus');

        // Reset the plane to the start of the runway
        plane.classList.remove('flying');
        void plane.offsetWidth; // force reflow to restart the animation
        flightMultiplier.textContent = '1.00';
        flightStatus.textContent = 'Analyzing market data...';
        plane.classList.add('flying');

        const start = performance.now();
        const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const value = 1 + (targetMultiplier - 1) * Math.pow(t, 2.2);
            flightMultiplier.textContent = value.toFixed(2);
            if (t < 1) {
                requestAnimationFrame(tick);
            } else {
                flightMultiplier.textContent = targetMultiplier.toFixed(2);
                flightStatus.textContent = `Predicted: ${targetMultiplier.toFixed(2)}x — see results below`;
            }
        };
        requestAnimationFrame(tick);
    }

    parseRounds(input) {
        return input
            .split(',')
            .map(val => parseFloat(val.trim()))
            .filter(val => !isNaN(val) && val > 0);
    }

    calculatePrediction(rounds, timeOfDay) {
        // Advanced prediction algorithm
        
        // 1. Calculate average multiplier
        const average = rounds.reduce((a, b) => a + b, 0) / rounds.length;

        // 2. Calculate volatility (standard deviation)
        const variance = rounds.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / rounds.length;
        const volatility = Math.sqrt(variance);

        // 3. Trend analysis
        const recentTrend = this.calculateTrend(rounds.slice(-3));

        // 4. Time-based multiplier (different patterns at different times)
        const timeMultiplier = this.getTimeMultiplier(timeOfDay);

        // 5. Predict next multiplier
        let predictedMultiplier = average + (recentTrend * 0.15) + (timeMultiplier * 0.1);

        // Momentum boost: strong upward trend projects higher outcomes
        const maxRound = Math.max(...rounds);
        if (recentTrend > 0) {
            predictedMultiplier += recentTrend * (maxRound / average) * 0.9;
        }
        // A big multiplier in recent history signals a high-potential stretch
        if (maxRound >= 10) {
            predictedMultiplier += maxRound * 0.35;
        }

        // Ensure realistic bounds (1.0x to 15.0x for aviator)
        predictedMultiplier = Math.max(1.1, Math.min(15.0, predictedMultiplier));

        // 6. Calculate confidence based on consistency
        const confidence = this.calculateConfidence(rounds, volatility, average);

        // 7. Calculate risk level
        const riskLevel = this.calculateRiskLevel(volatility, predictedMultiplier, rounds);

        // 8. Generate analysis details
        const analysis = this.generateAnalysis(rounds, average, volatility, recentTrend, timeOfDay);

        // 9. Generate recommendation
        const recommendation = this.generateRecommendation(confidence, riskLevel, predictedMultiplier);

        return {
            predictedMultiplier: predictedMultiplier.toFixed(2),
            confidence: confidence,
            riskLevel: riskLevel,
            analysis: analysis,
            recommendation: recommendation,
            timeOfDay: timeOfDay,
            averageMultiplier: average.toFixed(2),
            volatility: volatility.toFixed(3)
        };
    }

    calculateTrend(recentRounds) {
        if (recentRounds.length < 2) return 0;
        
        let trend = 0;
        for (let i = 1; i < recentRounds.length; i++) {
            trend += (recentRounds[i] - recentRounds[i - 1]);
        }
        return trend / (recentRounds.length - 1);
    }

    getTimeMultiplier(timeOfDay) {
        const multipliers = {
            'morning': 0.95,
            'afternoon': 1.05,
            'evening': 1.15,
            'night': 0.90
        };
        return multipliers[timeOfDay] || 1.0;
    }

    calculateConfidence(rounds, volatility, average) {
        // Confidence is higher when rounds are consistent (low volatility)
        const volatilityRatio = volatility / average;
        
        // Normalize to 0-100%
        let confidence = 100 - (volatilityRatio * 50);
        
        // Boost for recent stability
        const recentVolatility = this.calculateTrend(rounds.slice(-3));
        if (Math.abs(recentVolatility) < 0.1) {
            confidence += 10;
        }

        return Math.max(35, Math.min(95, Math.round(confidence)));
    }

    calculateRiskLevel(volatility, predictedMultiplier, rounds) {
        let riskScore = volatility * 20; // Base risk from volatility
        
        // Risk from predicted multiplier extremes
        if (predictedMultiplier > 10) {
            riskScore += 30;
        } else if (predictedMultiplier > 5) {
            riskScore += 20;
        } else if (predictedMultiplier > 3.5) {
            riskScore += 10;
        }

        // Risk from crashes (very low multipliers in history)
        const crashes = rounds.filter(r => r < 1.2).length;
        riskScore += crashes * 10;

        let level = 'LOW';
        if (riskScore > 60) {
            level = 'HIGH';
        } else if (riskScore > 35) {
            level = 'MEDIUM';
        }

        return { level: level, score: Math.round(riskScore) };
    }

    generateAnalysis(rounds, average, volatility, trend, timeOfDay) {
        const analysis = {
            'Market Volatility': `${volatility.toFixed(3)} (${volatility < 0.5 ? 'Low' : volatility < 1.0 ? 'Medium' : 'High'})`,
            'Average Multiplier': average.toFixed(2) + 'x',
            'Recent Trend': trend > 0 ? 'Increasing ↑' : 'Decreasing ↓',
            'Time Period Effect': `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} - ${this.getTimePeriodInsight(timeOfDay)}`,
            'Round Consistency': this.getConsistencyLevel(rounds),
            'Crash Frequency': `${rounds.filter(r => r < 1.2).length} crashes in ${rounds.length} rounds`
        };

        return analysis;
    }

    getTimePeriodInsight(timeOfDay) {
        const insights = {
            'morning': 'Typically Conservative',
            'afternoon': 'Balanced Patterns',
            'evening': 'High Multipliers',
            'night': 'Volatile Periods'
        };
        return insights[timeOfDay] || 'Normal';
    }

    getConsistencyLevel(rounds) {
        const avgDiff = this.calculateTrend(rounds.slice(-3));
        if (Math.abs(avgDiff) < 0.05) return 'Very Consistent';
        if (Math.abs(avgDiff) < 0.15) return 'Consistent';
        if (Math.abs(avgDiff) < 0.35) return 'Moderate';
        return 'Highly Variable';
    }

    generateRecommendation(confidence, riskLevel, predictedMultiplier) {
        let recommendation = '';

        if (confidence > 80 && riskLevel.level === 'LOW') {
            recommendation = `✓ STRONG PLAY: High confidence prediction of ${predictedMultiplier}x with LOW risk. Good odds for this round.`;
        } else if (confidence > 70 && riskLevel.level === 'MEDIUM') {
            recommendation = `✓ MODERATE PLAY: ${confidence}% confidence for ${predictedMultiplier}x outcome. Medium risk - consider smaller bet.`;
        } else if (confidence > 60 && riskLevel.level === 'MEDIUM') {
            recommendation = `⚠ CAUTIOUS PLAY: ${confidence}% confidence but MEDIUM risk detected. Bet conservatively or wait.`;
        } else if (riskLevel.level === 'HIGH') {
            recommendation = `✗ HIGH RISK: Despite ${confidence}% confidence, HIGH risk level detected. Consider sitting out this round.`;
        } else {
            recommendation = `⚠ NEUTRAL: Prediction uncertain. Only bet if you can afford the risk. Confidence: ${confidence}%`;
        }

        return recommendation;
    }

    displayPrediction(prediction) {
        const resultDiv = document.getElementById('predictionResult');
        const confidenceScore = document.getElementById('confidenceScore');
        const confidenceBar = document.getElementById('confidenceBar');
        const confidenceText = document.getElementById('confidenceText');
        const riskLevel = document.getElementById('riskLevel');
        const riskGauge = document.getElementById('riskGauge');
        const riskText = document.getElementById('riskText');
        const predictedMultiplier = document.getElementById('predictedMultiplier');
        const outcomeRange = document.getElementById('outcomeRange');
        const analysisDetails = document.getElementById('analysisDetails');
        const recommendationText = document.getElementById('recommendationText');

        // Update confidence
        confidenceScore.textContent = prediction.confidence;
        confidenceBar.style.width = prediction.confidence + '%';
        confidenceText.textContent = this.getConfidenceDescription(prediction.confidence);

        // Update risk level
        riskLevel.textContent = prediction.riskLevel.level;
        riskGauge.style.width = prediction.riskLevel.score + '%';
        riskGauge.style.backgroundColor = this.getRiskColor(prediction.riskLevel.level);
        riskText.textContent = `Risk Score: ${prediction.riskLevel.score}/100`;

        // Update multiplier
        predictedMultiplier.textContent = prediction.predictedMultiplier + 'x';
        const predicted = parseFloat(prediction.predictedMultiplier);
        const margin = Math.max(0.3, predicted * 0.12);
        const range = `Range: ${(predicted - margin).toFixed(2)}x - ${(predicted + margin).toFixed(2)}x`;
        outcomeRange.textContent = range;

        // Update analysis
        analysisDetails.innerHTML = '';
        for (const [key, value] of Object.entries(prediction.analysis)) {
            analysisDetails.innerHTML += `
                <div class="analysis-item">
                    <div class="analysis-item-title">${key}</div>
                    <div class="analysis-item-value">${value}</div>
                </div>
            `;
        }

        // Update recommendation
        recommendationText.textContent = prediction.recommendation;
        this.updateRecommendationStyle(prediction.confidence, prediction.riskLevel.level);

        // Show result
        resultDiv.classList.remove('hidden');

        // Add to history
        this.addToHistory(prediction);
        this.updateStats();
    }

    getConfidenceDescription(confidence) {
        if (confidence >= 80) return 'Very High - Strong Signal';
        if (confidence >= 70) return 'High - Good Signal';
        if (confidence >= 60) return 'Moderate - Fair Signal';
        if (confidence >= 50) return 'Low - Weak Signal';
        return 'Very Low - Unreliable';
    }

    getRiskColor(riskLevel) {
        const colors = {
            'LOW': '#2e7d32',
            'MEDIUM': '#e08a00',
            'HIGH': '#d90429'
        };
        return colors[riskLevel] || '#e08a00';
    }

    updateRecommendationStyle(confidence, riskLevel) {
        const box = document.querySelector('.recommendation-box');
        box.style.borderColor = this.getRiskColor(riskLevel);
        
        // Update text color based on recommendation strength
        if (confidence > 80 && riskLevel === 'LOW') {
            box.style.borderColor = '#2e7d32';
        } else if (confidence < 50 || riskLevel === 'HIGH') {
            box.style.borderColor = '#d90429';
        }
    }

    addToHistory(prediction) {
        const entry = {
            round: this.roundNumber++,
            prediction: prediction.predictedMultiplier,
            confidence: prediction.confidence,
            risk: prediction.riskLevel.level,
            actualResult: '—',
            accuracy: 'Pending'
        };

        this.predictionHistory.unshift(entry);
        if (this.predictionHistory.length > 20) {
            this.predictionHistory.pop();
        }

        this.updateHistoryTable();
        this.saveHistoryToStorage();
    }

    updateHistoryTable() {
        const historyBody = document.getElementById('historyBody');
        historyBody.innerHTML = '';

        this.predictionHistory.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${entry.round}</td>
                <td>${entry.prediction}x</td>
                <td>${entry.confidence}%</td>
                <td><span style="color: ${this.getRiskColor(entry.risk)}">${entry.risk}</span></td>
                <td>${entry.actualResult}</td>
                <td>${entry.accuracy}</td>
            `;
            historyBody.appendChild(row);
        });
    }

    updateStats() {
        const roundsAnalyzed = this.predictionHistory.length;
        const accurateCount = this.predictionHistory.filter(p => p.accuracy === 'Accurate').length;
        const avgConfidence = this.predictionHistory.length > 0
            ? Math.round(this.predictionHistory.reduce((sum, p) => sum + p.confidence, 0) / this.predictionHistory.length)
            : 0;

        document.getElementById('roundsAnalyzed').textContent = roundsAnalyzed;
        document.getElementById('accuracyRate').textContent = roundsAnalyzed > 0 
            ? Math.round((accurateCount / roundsAnalyzed) * 100) + '%'
            : '0%';
        document.getElementById('avgConfidence').textContent = avgConfidence + '%';
    }

    saveHistoryToStorage() {
        localStorage.setItem('aviatorHistory', JSON.stringify(this.predictionHistory));
        localStorage.setItem('roundNumber', this.roundNumber);
    }

    loadHistoryFromStorage() {
        const saved = localStorage.getItem('aviatorHistory');
        const savedRound = localStorage.getItem('roundNumber');
        
        if (saved) {
            this.predictionHistory = JSON.parse(saved);
            this.updateHistoryTable();
        }
        
        if (savedRound) {
            this.roundNumber = parseInt(savedRound);
        }
    }
}

// Initialize the predictor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AviatorPredictor();
});