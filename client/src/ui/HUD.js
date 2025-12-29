export class HUD {
  constructor() {
    this.container = null;
    this.speedEl = null;
    this.lapEl = null;
    this.timerEl = null;
    this.bestLapEl = null;
    
    this.createHUD();
  }

  createHUD() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'hud';
    this.container.innerHTML = `
      <div class="hud-panel">
        <div class="hud-row">
          <span class="hud-label">SPEED</span>
          <span class="hud-value" id="hud-speed">0</span>
          <span class="hud-unit">km/h</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">LAP</span>
          <span class="hud-value" id="hud-lap">1/3</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">TIME</span>
          <span class="hud-value" id="hud-timer">0:00.000</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">BEST</span>
          <span class="hud-value" id="hud-best">--:--.---</span>
        </div>
      </div>
      <div id="hud-message"></div>
      <div id="hud-finish" class="hidden">
        <div class="finish-title">RACE COMPLETE!</div>
        <div class="finish-stats">
          <div class="finish-row"><span>Total Time:</span><span id="finish-total">0:00.000</span></div>
          <div class="finish-row"><span>Best Lap:</span><span id="finish-best">0:00.000</span></div>
        </div>
        <div class="finish-hint">Press SPACE to restart</div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #hud {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        z-index: 100;
      }
      .hud-panel {
        position: absolute;
        top: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.7);
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        min-width: 180px;
      }
      .hud-row {
        display: flex;
        align-items: baseline;
        margin: 8px 0;
      }
      .hud-label {
        font-size: 12px;
        color: #aaa;
        width: 50px;
        text-transform: uppercase;
      }
      .hud-value {
        font-size: 24px;
        font-weight: bold;
        color: #fff;
        min-width: 100px;
      }
      .hud-unit {
        font-size: 12px;
        color: #888;
        margin-left: 5px;
      }
      #hud-speed {
        color: #4CAF50;
      }
      #hud-lap {
        color: #2196F3;
      }
      #hud-timer {
        color: #FFC107;
      }
      #hud-best {
        color: #9C27B0;
      }
      #hud-message {
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 64px;
        font-weight: bold;
        color: white;
        text-shadow: 3px 3px 6px rgba(0,0,0,0.5);
        opacity: 0;
        transition: opacity 0.3s;
      }
      #hud-message.show {
        opacity: 1;
      }
      #hud-finish {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.85);
        padding: 30px 50px;
        border-radius: 15px;
        text-align: center;
        color: white;
        max-width: 90%;
        box-sizing: border-box;
      }
      #hud-finish.hidden {
        display: none;
      }
      .finish-title {
        font-size: 36px;
        font-weight: bold;
        color: #FFD700;
        margin-bottom: 20px;
      }
      .finish-stats {
        margin: 15px 0;
      }
      .finish-row {
        display: flex;
        justify-content: space-between;
        font-size: 20px;
        margin: 10px 0;
        gap: 30px;
      }
      .finish-row span:first-child {
        color: #aaa;
      }
      .finish-row span:last-child {
        font-weight: bold;
        color: #4CAF50;
      }
      .finish-hint {
        margin-top: 30px;
        font-size: 18px;
        color: #888;
      }
    `;

    document.head.appendChild(style);
    const gameContainer = document.getElementById('game-container');
    gameContainer.appendChild(this.container);

    // Cache elements
    this.speedEl = document.getElementById('hud-speed');
    this.lapEl = document.getElementById('hud-lap');
    this.timerEl = document.getElementById('hud-timer');
    this.bestLapEl = document.getElementById('hud-best');
    this.messageEl = document.getElementById('hud-message');
    this.finishEl = document.getElementById('hud-finish');
    this.finishTotalEl = document.getElementById('finish-total');
    this.finishBestEl = document.getElementById('finish-best');
  }

  update(speed, currentLap, totalLaps, raceTime, bestLap) {
    // Speed (convert to km/h, assuming units are m/s)
    const speedKmh = Math.abs(Math.round(speed * 3.6));
    this.speedEl.textContent = speedKmh;

    // Lap
    this.lapEl.textContent = `${currentLap}/${totalLaps}`;

    // Timer
    this.timerEl.textContent = this.formatTime(raceTime);

    // Best lap
    if (bestLap) {
      this.bestLapEl.textContent = this.formatTime(bestLap);
    }
  }

  formatTime(ms) {
    if (!ms || ms <= 0) return '0:00.000';
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor(ms % 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  showMessage(text, duration = 2000) {
    this.messageEl.textContent = text;
    this.messageEl.classList.add('show');
    
    setTimeout(() => {
      this.messageEl.classList.remove('show');
    }, duration);
  }

  showFinish(totalTime, bestLap) {
    this.finishTotalEl.textContent = this.formatTime(totalTime);
    this.finishBestEl.textContent = this.formatTime(bestLap);
    this.finishEl.classList.remove('hidden');
  }

  hideFinish() {
    this.finishEl.classList.add('hidden');
  }

  dispose() {
    if (this.container) {
      this.container.remove();
    }
  }
}
