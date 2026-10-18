// =========================================================================
// SUPER RADAR AO VIVO 365 DA BARRA (MOTOR VETORIAL SVG HD + ESTÁDIO 3D)
// =========================================================================

let animBallX = 0.5;
let animBallY = 0.5;
let animZoneX = 0.65;
let radarPulse = 0;
let chevronOffset = 0;
let goalCelebrationTimer = 0;
let audioCtx = null;

// Cache de estado para evitar re-renderizações desnecessárias no DOM
let lastMatchIdRendered = null;
let lastLogoA = '';
let lastLogoB = '';
let lastTrailHash = '';

// Dimensões internas exatas do <svg id="pitch-svg" viewBox="0 0 800 450">
const SVG_W = 800;
const SVG_H = 450;
const PITCH_X = 30;
const PITCH_Y = 25;
const PITCH_W = 740;
const PITCH_H = 400;

// Formações base 11v11 (exibidas quando o usuário ativa "👕 22 Jogadores")
const baseFormationA = [
    { x: 0.05, y: 0.50, num: '1' },
    { x: 0.19, y: 0.16, num: '2' }, { x: 0.17, y: 0.38, num: '3' }, { x: 0.17, y: 0.62, num: '4' }, { x: 0.19, y: 0.84, num: '6' },
    { x: 0.38, y: 0.26, num: '5' }, { x: 0.34, y: 0.50, num: '8' }, { x: 0.38, y: 0.74, num: '10' },
    { x: 0.58, y: 0.20, num: '7' }, { x: 0.63, y: 0.50, num: '9' }, { x: 0.58, y: 0.80, num: '11' }
];

const baseFormationB = [
    { x: 0.95, y: 0.50, num: '1' },
    { x: 0.81, y: 0.16, num: '2' }, { x: 0.83, y: 0.38, num: '3' }, { x: 0.83, y: 0.62, num: '4' }, { x: 0.81, y: 0.84, num: '6' },
    { x: 0.62, y: 0.26, num: '5' }, { x: 0.66, y: 0.50, num: '8' }, { x: 0.62, y: 0.74, num: '10' },
    { x: 0.42, y: 0.22, num: '7' }, { x: 0.37, y: 0.50, num: '9' }, { x: 0.42, y: 0.78, num: '11' }
];

function playTrackerSound(type) {
    if (!window.BetProData.soundEnabled) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioCtx.currentTime;
        if (type === 'whistle') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2750, now);
            osc.frequency.exponentialRampToValueAtTime(2950, now + 0.18);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'goal') {
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + i * 0.08);
                gain.gain.setValueAtTime(0.12, now + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now + i * 0.08);
                osc.stop(now + 0.9);
            });
        }
    } catch (e) {}
}

function updateScoreboardHeader() {
    const m = window.BetProData.matches.find(x => x.id === window.BetProData.selectedMatchId);
    if (!m) return;

    const elHomeName = document.getElementById('sb-home-name');
    const elAwayName = document.getElementById('sb-away-name');
    if (elHomeName) elHomeName.innerText = m.teamA;
    if (elAwayName) elAwayName.innerText = m.teamB;

    const homeLogo = document.getElementById('sb-home-logo');
    const awayLogo = document.getElementById('sb-away-logo');
    if (homeLogo && m.logoA && homeLogo.src !== m.logoA) homeLogo.src = m.logoA;
    if (awayLogo && m.logoB && awayLogo.src !== m.logoB) awayLogo.src = m.logoB;

    const elHomeForm = document.getElementById('sb-home-formation');
    const elAwayForm = document.getElementById('sb-away-formation');
    const recA = m.recordA ? ` • Campanha: ${m.recordA}` : '';
    const recB = m.recordB ? ` • Campanha: ${m.recordB}` : '';
    if (elHomeForm) elHomeForm.innerText = `${m.formationA || 'Titular'}${recA}`;
    if (elAwayForm) elAwayForm.innerText = `${m.formationB || 'Titular'}${recB}`;

    const elScore = document.getElementById('sb-score');
    if (elScore) elScore.innerText = `${m.scoreA} - ${m.scoreB}`;

    const elClock = document.getElementById('sb-clock');
    if (elClock) {
        if (m.isLive) {
            const clk = m.displayClock || `${m.minute}:${String(m.second).padStart(2, '0')}'`;
            elClock.innerText = `AO VIVO • ${clk} • ${m.statusDescription || 'Em Andamento'}`;
        } else {
            elClock.innerText = m.timeLabel || m.statusDescription || 'Partida Oficial';
        }
    }

    const elStadium = document.getElementById('sb-stadium');
    if (elStadium) elStadium.innerText = `🏟️ ${m.stadium || 'Estádio Oficial'}${m.oddsProvider ? ` • 📊 Odds: ${m.oddsProvider}` : ''}`;

    const elEventsStrip = document.getElementById('sb-events-strip');
    if (elEventsStrip) {
        if (m.realEventsSummary && m.realEventsSummary.length > 0) {
            elEventsStrip.innerText = m.realEventsSummary.join('   •   ');
        } else if (m.formA || m.formB) {
            elEventsStrip.innerText = `Últimos 5 Jogos: ${m.shortA} [${m.formA || '-'}]  vs  ${m.shortB} [${m.formB || '-'}]`;
        } else {
            elEventsStrip.innerText = '';
        }
    }

    const elFeedCount = document.getElementById('feed-count');
    if (elFeedCount) elFeedCount.innerText = (m.state && m.state.feed) ? m.state.feed.length : 0;

    const bc = document.getElementById('mc-breadcrumb');
    if (bc) bc.innerText = `${m.league} > ${m.teamA} x ${m.teamB}`;

    // Sincroniza estado visual da perspectiva 3D
    const wrap3D = document.getElementById('pitch-3d-wrap');
    if (wrap3D) {
        wrap3D.classList.toggle('perspective-3d', !!window.BetProData.pitchPerspective3D);
    }
}

function drawPitch() {
    const svg = document.getElementById('pitch-svg');
    if (!svg) {
        requestAnimationFrame(drawPitch);
        return;
    }

    const m = window.BetProData.matches.find(x => x.id === window.BetProData.selectedMatchId);
    if (!m) {
        requestAnimationFrame(drawPitch);
        return;
    }

    // Interpolação suave a 60fps para bola e zona de pressão
    animBallX += (m.state.targetX - animBallX) * 0.09;
    animBallY += (m.state.targetY - animBallY) * 0.09;
    radarPulse = (radarPulse + 0.028) % 1;
    chevronOffset = (chevronOffset + 0.45) % 48;

    const isTeamA = m.state.possessionTeam === 'A';
    const zone = m.state.zone || 'attack';

    // Alvo da cortina tática (Estilo Sportradar / Bet365)
    let targetZoneNorm = 0.56;
    if (isTeamA) {
        targetZoneNorm = zone === 'danger' ? 0.94 : (zone === 'attack' ? 0.76 : 0.56);
    } else {
        targetZoneNorm = zone === 'danger' ? 0.06 : (zone === 'attack' ? 0.24 : 0.44);
    }
    animZoneX += (targetZoneNorm - animZoneX) * 0.07;

    // 1. Atualiza Escudos Vetoriais no Gramado apenas quando mudarem
    if (lastLogoA !== m.logoA) {
        const elLogoA = document.getElementById('svg-logo-home');
        if (elLogoA && m.logoA) elLogoA.setAttribute('href', m.logoA);
        lastLogoA = m.logoA;
    }
    if (lastLogoB !== m.logoB) {
        const elLogoB = document.getElementById('svg-logo-away');
        if (elLogoB && m.logoB) elLogoB.setAttribute('href', m.logoB);
        lastLogoB = m.logoB;
    }

    // 2. Atualiza Cortina de Ataque / Ataque Perigoso (SVG Polygon + Setas)
    updateSvgTacticalZone(m, isTeamA, zone);

    // 3. Atualiza Mapa de Calor (se ativo)
    updateSvgHeatmap(m);

    // 4. Atualiza 22 Jogadores Vetoriais (se ativo)
    updateSvgPlayers(m);

    // 5. Posição da Bola e Rastro Vetorial
    const bx = PITCH_X + animBallX * PITCH_W;
    const by = PITCH_Y + animBallY * PITCH_H;

    updateSvgBallTrail(m, bx, by);
    updateSvgBallAndRadar(m, bx, by, zone);

    // 6. Atualiza HUD de Transmissão HTML e Etiqueta da Bola (100% Nítidos)
    updateBroadcastHUD(m, bx, by, isTeamA, zone);

    // 7. Banner Especial de Comemoração de GOL!
    const goalBanner = document.getElementById('goal-celebration-banner');
    if (goalCelebrationTimer > 0) {
        goalCelebrationTimer--;
        if (goalBanner) {
            goalBanner.classList.add('active');
            const scoreSub = document.getElementById('goal-banner-score');
            if (scoreSub) scoreSub.innerText = `${m.teamA} ${m.scoreA} x ${m.scoreB} ${m.teamB}`;
        }
    } else if (goalBanner && goalBanner.classList.contains('active')) {
        goalBanner.classList.remove('active');
    }

    requestAnimationFrame(drawPitch);
}

function updateSvgTacticalZone(m, isTeamA, zone) {
    const poly = document.getElementById('svg-zone-poly');
    const edge = document.getElementById('svg-zone-edge');
    const chevronsGroup = document.getElementById('svg-zone-chevrons');
    if (!poly || !edge || !chevronsGroup) return;

    const frontX = PITCH_X + animZoneX * PITCH_W;
    const midY = PITCH_Y + PITCH_H / 2;
    const tipOffset = isTeamA ? 38 : -38;
    const tipX = Math.max(PITCH_X, Math.min(PITCH_X + PITCH_W, frontX + tipOffset));

    if (isTeamA) {
        poly.setAttribute(
            'points',
            `${PITCH_X},${PITCH_Y} ${frontX.toFixed(1)},${PITCH_Y} ${tipX.toFixed(1)},${midY} ${frontX.toFixed(1)},${PITCH_Y + PITCH_H} ${PITCH_X},${PITCH_Y + PITCH_H}`
        );
        poly.setAttribute('fill', zone === 'danger' ? 'url(#gradDangerHome)' : 'url(#gradZoneHome)');
    } else {
        const rightEdge = PITCH_X + PITCH_W;
        poly.setAttribute(
            'points',
            `${rightEdge},${PITCH_Y} ${frontX.toFixed(1)},${PITCH_Y} ${tipX.toFixed(1)},${midY} ${frontX.toFixed(1)},${PITCH_Y + PITCH_H} ${rightEdge},${PITCH_Y + PITCH_H}`
        );
        poly.setAttribute('fill', zone === 'danger' ? 'url(#gradDangerAway)' : 'url(#gradZoneAway)');
    }

    edge.setAttribute(
        'points',
        `${frontX.toFixed(1)},${PITCH_Y} ${tipX.toFixed(1)},${midY} ${frontX.toFixed(1)},${PITCH_Y + PITCH_H}`
    );

    const strokeColor = zone === 'danger' ? '#ff3d57' : (isTeamA ? '#00e676' : '#29b6f6');
    edge.setAttribute('stroke', strokeColor);

    // Setas Direcionais Vetoriais (Chevrons de Pressão)
    let chevronsSvg = '';
    if (isTeamA) {
        for (let x = PITCH_X + 90 + chevronOffset; x < frontX - 25; x += 95) {
            chevronsSvg += `<polyline points="${(x - 12).toFixed(1)},${midY - 26} ${(x + 6).toFixed(1)},${midY} ${(x - 12).toFixed(1)},${midY + 26}" fill="none" stroke="${strokeColor}" stroke-width="2.8" stroke-linecap="round" opacity="0.35"/>`;
        }
    } else {
        for (let x = PITCH_X + PITCH_W - 90 - chevronOffset; x > frontX + 25; x -= 95) {
            chevronsSvg += `<polyline points="${(x + 12).toFixed(1)},${midY - 26} ${(x - 6).toFixed(1)},${midY} ${(x + 12).toFixed(1)},${midY + 26}" fill="none" stroke="${strokeColor}" stroke-width="2.8" stroke-linecap="round" opacity="0.35"/>`;
        }
    }
    chevronsGroup.innerHTML = chevronsSvg;
}

function updateSvgBallTrail(m, bx, by) {
    const trailLayer = document.getElementById('svg-trail-layer');
    const ballPath = document.getElementById('svg-ball-path');
    const shadowPath = document.getElementById('svg-ground-shadow');
    const nodesGroup = document.getElementById('svg-pass-nodes');
    if (!trailLayer || !ballPath || !shadowPath || !nodesGroup) return;

    if (!window.BetProData.showBallTrail || !m.state.trail || m.state.trail.length < 1) {
        trailLayer.style.display = 'none';
        return;
    }
    trailLayer.style.display = 'block';

    const trail = m.state.trail;
    const pts = trail.map(pt => ({
        x: PITCH_X + pt.x * PITCH_W,
        y: PITCH_Y + pt.y * PITCH_H
    }));

    const lastPt = pts[pts.length - 1];

    if (m.state.arcMode && pts.length >= 1) {
        const startPt = pts.length > 1 ? pts[pts.length - 2] : pts[0];
        // Sombra reta no gramado
        shadowPath.setAttribute('d', `M ${startPt.x.toFixed(1)} ${startPt.y.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}`);
        // Arco parabólico elevado (Cruzamento / Lançamento longo)
        const ctrlX = (startPt.x + bx) / 2;
        const ctrlY = Math.min(startPt.y, by) - 65;
        ballPath.setAttribute('d', `M ${startPt.x.toFixed(1)} ${startPt.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`);
        ballPath.setAttribute('stroke', '#00e676');
    } else {
        shadowPath.setAttribute('d', '');
        let d = '';
        for (let i = 0; i < pts.length - 1; i++) {
            d += (i === 0 ? 'M ' : ' L ') + `${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
        }
        if (pts.length === 1) {
            d = `M ${lastPt.x.toFixed(1)} ${lastPt.y.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}`;
        } else {
            d += ` L ${bx.toFixed(1)} ${by.toFixed(1)}`;
        }
        ballPath.setAttribute('d', d);
        ballPath.setAttribute('stroke', '#ffd600');
    }

    // Renderiza nós de origem dos passes (1, 2, 3) apenas se a trilha mudou
    const currentHash = `${m.id}_${trail.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(';')}`;
    if (currentHash !== lastTrailHash) {
        lastTrailHash = currentHash;
        let nodesHtml = '';
        for (let i = 0; i < pts.length - 1; i++) {
            const p = pts[i];
            nodesHtml += `
                <g transform="translate(${p.x.toFixed(1)}, ${p.y.toFixed(1)})">
                    <circle cx="0" cy="0" r="8" fill="#0b111a" stroke="#ffd600" stroke-width="2"/>
                    <text x="0" y="3.5" text-anchor="middle" fill="#ffd600" font-size="10" font-weight="900" font-family="Segoe UI, sans-serif">${i + 1}</text>
                </g>
            `;
        }
        nodesGroup.innerHTML = nodesHtml;
    }
}

function updateSvgBallAndRadar(m, bx, by, zone) {
    const ballGroup = document.getElementById('svg-ball-group');
    const ping1 = document.getElementById('svg-ball-Ping1');
    const ping2 = document.getElementById('svg-ball-Ping2');
    if (!ballGroup) return;

    ballGroup.setAttribute('transform', `translate(${bx.toFixed(1)}, ${by.toFixed(1)})`);

    const pingColor = zone === 'danger' ? '#ff3d57' : (zone === 'attack' ? '#ffd600' : '#00e676');
    if (ping1) {
        ping1.setAttribute('r', (11 + radarPulse * 26).toFixed(1));
        ping1.setAttribute('opacity', (1 - radarPulse).toFixed(2));
        ping1.setAttribute('stroke', pingColor);
    }
    if (ping2) {
        const pulse2 = (radarPulse + 0.5) % 1;
        ping2.setAttribute('r', (11 + pulse2 * 26).toFixed(1));
        ping2.setAttribute('opacity', ((1 - pulse2) * 0.65).toFixed(2));
        ping2.setAttribute('stroke', pingColor);
    }
}

function updateBroadcastHUD(m, bx, by, isTeamA, zone) {
    const hudBox = document.getElementById('pitch-hud-box');
    const badgeEl = document.getElementById('hud-zone-badge');
    const titleEl = document.getElementById('hud-action-title');
    const subEl = document.getElementById('hud-action-sub');

    if (hudBox) {
        hudBox.classList.toggle('danger-mode', zone === 'danger');
        hudBox.classList.toggle('away-mode', !isTeamA && zone !== 'danger');
    }

    if (badgeEl) {
        const badgeLabel = zone === 'danger'
            ? '🔥 ATAQUE PERIGOSO'
            : (zone === 'attack' ? '⚡ NO ATAQUE' : '🔄 POSSE DE BOLA');
        if (badgeEl.innerText !== badgeLabel) badgeEl.innerText = badgeLabel;
    }

    if (titleEl && titleEl.innerText !== m.state.actionText) {
        titleEl.innerText = m.state.actionText;
    }
    if (subEl && subEl.innerText !== m.state.subText) {
        subEl.innerText = m.state.subText;
    }

    // Etiqueta HTML flutuante sobre a bola
    const ballTag = document.getElementById('ball-floating-tag');
    const ballPlayer = document.getElementById('ball-tag-player');
    const ballDot = document.getElementById('ball-tag-dot');
    if (ballTag) {
        const pctX = Math.max(12, Math.min(88, (bx / SVG_W) * 100));
        const pctY = Math.max(18, Math.min(88, (by / SVG_H) * 100));
        ballTag.style.left = `${pctX.toFixed(1)}%`;
        ballTag.style.top = `${pctY.toFixed(1)}%`;

        if (ballPlayer) {
            const label = m.state.activePlayer || (isTeamA ? m.teamA : m.teamB);
            if (ballPlayer.innerText !== label) ballPlayer.innerText = label;
        }
        if (ballDot) {
            const dotColor = zone === 'danger' ? '#ff3d57' : (isTeamA ? '#00e676' : '#29b6f6');
            ballDot.style.background = dotColor;
            ballDot.style.boxShadow = `0 0 8px ${dotColor}`;
        }
    }
}

function updateSvgPlayers(m) {
    const layer = document.getElementById('svg-players-layer');
    if (!layer) return;

    if (!window.BetProData.showPlayersOnPitch) {
        if (layer.style.display !== 'none') layer.style.display = 'none';
        return;
    }
    layer.style.display = 'block';

    const shiftX = (animBallX - 0.5) * 0.24;
    const shiftY = (animBallY - 0.5) * 0.16;

    let html = '';
    const renderTeam = (formation, fillColor, textColor, jerseys) => {
        formation.forEach((pos, idx) => {
            const factor = idx === 0 ? 0.04 : 1;
            const nx = Math.min(0.95, Math.max(0.05, pos.x + shiftX * factor));
            const ny = Math.min(0.93, Math.max(0.07, pos.y + shiftY * factor));
            const px = (PITCH_X + nx * PITCH_W).toFixed(1);
            const py = (PITCH_Y + ny * PITCH_H).toFixed(1);
            const num = (jerseys && jerseys[idx]) ? jerseys[idx] : pos.num;

            html += `
                <g transform="translate(${px}, ${py})">
                    <circle cx="0" cy="2" r="9.5" fill="rgba(0,0,0,0.45)"/>
                    <circle cx="0" cy="0" r="9.5" fill="${fillColor}" stroke="#0b111a" stroke-width="2"/>
                    <text x="0" y="3.5" text-anchor="middle" fill="${textColor}" font-size="9.5" font-weight="900" font-family="Segoe UI, sans-serif">${num}</text>
                </g>
            `;
        });
    };

    const colorA = m.colorA || '#e53935';
    const colorB = m.colorB || '#1e88e5';
    const textA = (colorA === '#f5f5f5' || colorA === '#e0e0e0' || colorA === '#f59e0b' || colorA === '#ffffff') ? '#090d14' : '#ffffff';
    const textB = (colorB === '#f5f5f5' || colorB === '#e0e0e0' || colorB === '#f59e0b' || colorB === '#ffffff') ? '#090d14' : '#ffffff';

    renderTeam(baseFormationA, colorA, textA, m.starterJerseysA);
    renderTeam(baseFormationB, colorB, textB, m.starterJerseysB);
    layer.innerHTML = html;
}

function updateSvgHeatmap(m) {
    const layer = document.getElementById('svg-heatmap-layer');
    if (!layer) return;

    if (!window.BetProData.showHeatmap) {
        if (layer.style.display !== 'none') layer.style.display = 'none';
        return;
    }
    layer.style.display = 'block';

    const spots = [
        ...(m.state.trail || []),
        { x: animBallX, y: animBallY },
        { x: m.state.possessionTeam === 'A' ? 0.78 : 0.22, y: 0.48 }
    ];

    let html = '';
    spots.forEach(pt => {
        const cx = (PITCH_X + pt.x * PITCH_W).toFixed(1);
        const cy = (PITCH_Y + pt.y * PITCH_H).toFixed(1);
        html += `<circle cx="${cx}" cy="${cy}" r="68" fill="url(#heatSpot)"/>`;
    });
    layer.innerHTML = html;
}

function togglePlayersView() {
    window.BetProData.showPlayersOnPitch = !window.BetProData.showPlayersOnPitch;
    const btn = document.getElementById('btn-toggle-players');
    if (btn) btn.classList.toggle('active', window.BetProData.showPlayersOnPitch);
}

function toggleTrailView() {
    window.BetProData.showBallTrail = !window.BetProData.showBallTrail;
    const btn = document.getElementById('btn-toggle-trail');
    if (btn) btn.classList.toggle('active', window.BetProData.showBallTrail);
}

function toggleHeatmapView() {
    window.BetProData.showHeatmap = !window.BetProData.showHeatmap;
    const btn = document.getElementById('btn-toggle-heatmap');
    if (btn) btn.classList.toggle('active', window.BetProData.showHeatmap);
}

function togglePerspectiveView() {
    window.BetProData.pitchPerspective3D = !window.BetProData.pitchPerspective3D;
    const btn = document.getElementById('btn-toggle-3d');
    if (btn) btn.classList.toggle('active', window.BetProData.pitchPerspective3D);
    const wrap3D = document.getElementById('pitch-3d-wrap');
    if (wrap3D) wrap3D.classList.toggle('perspective-3d', window.BetProData.pitchPerspective3D);
}

function toggleSoundEffects() {
    window.BetProData.soundEnabled = !window.BetProData.soundEnabled;
    const btn = document.getElementById('btn-toggle-sound');
    if (btn) {
        btn.classList.toggle('active', window.BetProData.soundEnabled);
        btn.innerText = window.BetProData.soundEnabled ? '🔊 Som' : '🔇 Som';
    }
    if (window.BetProData.soundEnabled) playTrackerSound('whistle');
}
