// Performance Dashboard - renders live trends and summary stats from prediction history
class DashboardRenderer {
    constructor() {
        this.colors = {
            accent: '#00b894',
            success: '#00d4ff',
            warning: '#ffa500',
            danger: '#ff4757',
            text: '#b0b0b0'
        };
    }

    update(history) {
        this.renderSummaryStats(history);
        this.renderTrendChart(history);
        this.renderRiskChart(history);
        this.renderConfidenceChart(history);
    }

    getRiskColor(risk) {
        return { LOW: this.colors.success, MEDIUM: this.colors.warning, HIGH: this.colors.danger }[risk] || this.colors.warning;
    }

    renderSummaryStats(history) {
        const container = document.getElementById('dashboardSummary');
        if (!container) return;

        if (history.length === 0) {
            container.innerHTML = this.summaryHTML('—', '—', '—', '—', '');
            return;
        }

        const multipliers = history.map(h => parseFloat(h.prediction));
        const highest = Math.max(...multipliers).toFixed(2);
        const lowest = Math.min(...multipliers).toFixed(2);
        const avg = (multipliers.reduce((a, b) => a + b, 0) / multipliers.length).toFixed(2);

        const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
        history.forEach(h => { riskCounts[h.risk] = (riskCounts[h.risk] || 0) + 1; });
        const dominantRisk = Object.entries(riskCounts).sort((a, b) => b[1] - a[1])[0][0];

        container.innerHTML = this.summaryHTML(
            highest, lowest, avg, dominantRisk,
            this.getRiskColor(dominantRisk)
        );
    }

    summaryHTML(highest, lowest, avg, risk, riskColor) {
        return `
            <div class="dash-stat-card">
                <h3>Highest Prediction</h3>
                <p class="dash-stat-value" style="color:${this.colors.success}">${highest}${highest !== '—' ? 'x' : ''}</p>
            </div>
            <div class="dash-stat-card">
                <h3>Lowest Prediction</h3>
                <p class="dash-stat-value" style="color:${this.colors.warning}">${lowest}${lowest !== '—' ? 'x' : ''}</p>
            </div>
            <div class="dash-stat-card">
                <h3>Average Multiplier</h3>
                <p class="dash-stat-value" style="color:${this.colors.accent}">${avg}${avg !== '—' ? 'x' : ''}</p>
            </div>
            <div class="dash-stat-card">
                <h3>Dominant Risk</h3>
                <p class="dash-stat-value" style="color:${riskColor || this.colors.text}">${risk}</p>
            </div>
        `;
    }

    renderTrendChart(history) {
        const svg = document.getElementById('trendChart');
        if (!svg) return;

        if (history.length === 0) {
            svg.innerHTML = this.emptyState('No data yet — make a prediction');
            return;
        }

        const data = [...history].reverse();
        const W = 300, H = 150;
        const P = { top: 15, right: 15, bottom: 25, left: 35 };
        const cW = W - P.left - P.right;
        const cH = H - P.top - P.bottom;

        const vals = data.map(d => parseFloat(d.prediction));
        const minV = Math.min(...vals, 1);
        const maxV = Math.max(...vals, 2);
        const range = maxV - minV || 1;
        const xStep = data.length > 1 ? cW / (data.length - 1) : 0;

        const pts = data.map((d, i) => ({
            x: P.left + i * xStep,
            y: P.top + cH - ((parseFloat(d.prediction) - minV) / range) * cH
        }));

        const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const areaPath = linePath + ` L ${pts[pts.length - 1].x} ${P.top + cH} L ${pts[0].x} ${P.top + cH} Z`;

        let grid = '';
        for (let i = 0; i <= 3; i++) {
            const y = P.top + (cH / 3) * i;
            const v = (maxV - (range / 3) * i).toFixed(1);
            grid += `<line x1="${P.left}" y1="${y}" x2="${W - P.right}" y2="${y}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>`;
            grid += `<text x="${P.left - 5}" y="${y + 3}" text-anchor="end" fill="${this.colors.text}" font-size="9">${v}x</text>`;
        }

        let dots = pts.map(p =>
            `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${this.colors.accent}" stroke="#fff" stroke-width="1"/>`
        ).join('');

        svg.innerHTML = `
            <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${this.colors.accent}" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="${this.colors.accent}" stop-opacity="0"/>
                </linearGradient>
            </defs>
            ${grid}
            <path d="${areaPath}" fill="url(#trendGrad)"/>
            <path d="${linePath}" fill="none" stroke="${this.colors.accent}" stroke-width="2"/>
            ${dots}
        `;
    }

    renderRiskChart(history) {
        const svg = document.getElementById('riskChart');
        if (!svg) return;

        if (history.length === 0) {
            svg.innerHTML = this.emptyState('No risk data yet');
            return;
        }

        const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
        history.forEach(h => { counts[h.risk] = (counts[h.risk] || 0) + 1; });
        const total = history.length;

        const cx = 75, cy = 75, r = 58, ir = 33;
        let start = -Math.PI / 2;

        const segments = [
            { label: 'LOW', value: counts.LOW, color: this.colors.success },
            { label: 'MEDIUM', value: counts.MEDIUM, color: this.colors.warning },
            { label: 'HIGH', value: counts.HIGH, color: this.colors.danger }
        ].filter(s => s.value > 0);

        let paths = '';
        segments.forEach(seg => {
            const angle = (seg.value / total) * Math.PI * 2;
            const end = start + angle;
            const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
            const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
            const x3 = cx + ir * Math.cos(end), y3 = cy + ir * Math.sin(end);
            const x4 = cx + ir * Math.cos(start), y4 = cy + ir * Math.sin(start);
            const la = angle > Math.PI ? 1 : 0;
            paths += `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2} L ${x3} ${y3} A ${ir} ${ir} 0 ${la} 0 ${x4} ${y4} Z" fill="${seg.color}" opacity="0.85"/>`;
            start = end;
        });

        let legend = '';
        let ly = 20;
        segments.forEach(seg => {
            const pct = Math.round((seg.value / total) * 100);
            legend += `<rect x="160" y="${ly}" width="10" height="10" rx="2" fill="${seg.color}"/>`;
            legend += `<text x="176" y="${ly + 9}" fill="#fff" font-size="11">${seg.label}: ${seg.value} (${pct}%)</text>`;
            ly += 20;
        });

        svg.innerHTML = `
            ${paths}
            <text x="${cx}" y="${cy + 3}" text-anchor="middle" fill="#fff" font-size="18" font-weight="bold">${total}</text>
            <text x="${cx}" y="${cy + 16}" text-anchor="middle" fill="${this.colors.text}" font-size="9">rounds</text>
            ${legend}
        `;
    }

    renderConfidenceChart(history) {
        const svg = document.getElementById('confidenceChart');
        if (!svg) return;

        if (history.length === 0) {
            svg.innerHTML = this.emptyState('No confidence data yet');
            return;
        }

        const data = [...history].reverse().slice(-10);
        const W = 300, H = 150;
        const P = { top: 18, right: 15, bottom: 25, left: 35 };
        const cW = W - P.left - P.right;
        const cH = H - P.top - P.bottom;
        const barW = cW / data.length;
        const gap = barW * 0.25;
        const aW = barW - gap;

        let grid = '';
        for (let i = 0; i <= 4; i++) {
            const y = P.top + (cH / 4) * i;
            const v = 100 - i * 25;
            grid += `<line x1="${P.left}" y1="${y}" x2="${W - P.right}" y2="${y}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>`;
            grid += `<text x="${P.left - 5}" y="${y + 3}" text-anchor="end" fill="${this.colors.text}" font-size="9">${v}%</text>`;
        }

        let bars = '';
        data.forEach((d, i) => {
            const barH = (d.confidence / 100) * cH;
            const x = P.left + i * barW + gap / 2;
            const y = P.top + cH - barH;
            const color = d.confidence >= 70 ? this.colors.success : d.confidence >= 50 ? this.colors.warning : this.colors.danger;
            bars += `<rect x="${x}" y="${y}" width="${aW}" height="${barH}" rx="2" fill="${color}" opacity="0.85"/>`;
            bars += `<text x="${x + aW / 2}" y="${y - 3}" text-anchor="middle" fill="${this.colors.text}" font-size="8">${d.confidence}%</text>`;
        });

        svg.innerHTML = grid + bars;
    }

    emptyState(msg) {
        return `<text x="50%" y="50%" text-anchor="middle" fill="${this.colors.text}" font-size="13">${msg}</text>`;
    }
}

window.dashboard = new DashboardRenderer();
