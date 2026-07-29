// popup.js

const slider = document.getElementById('slider');
const centsDisplay = document.getElementById('centsDisplay');
const semitoneDisplay = document.getElementById('semitoneDisplay');

// セント → ピッチ係数 (2^(cents/1200))
function centsToFactor(cents) {
  return Math.pow(2, cents / 1200);
}

function updateDisplay(cents) {
  centsDisplay.textContent = cents >= 0 ? `+${cents}` : `${cents}`;
  const semitones = (cents / 100).toFixed(1);
  semitoneDisplay.textContent = `${semitones >= 0 ? '+' : ''}${semitones} 半音`;
}

async function sendPitch(cents) {
  updateDisplay(cents);
  const factor = centsToFactor(cents);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { type: 'SET_PITCH', factor }).catch(() => {
    // content script がまだ注入されていない場合は scripting API で強制注入
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }).then(() => {
      chrome.tabs.sendMessage(tab.id, { type: 'SET_PITCH', factor });
    });
  });
}

// スライダー操作
slider.addEventListener('input', () => {
  sendPitch(Number(slider.value));
});

// ボタン操作
document.getElementById('downBtn').addEventListener('click', () => {
  slider.value = Math.max(-1200, Number(slider.value) - 100);
  sendPitch(Number(slider.value));
});
document.getElementById('upBtn').addEventListener('click', () => {
  slider.value = Math.min(1200, Number(slider.value) + 100);
  sendPitch(Number(slider.value));
});
document.getElementById('resetBtn').addEventListener('click', () => {
  slider.value = 0;
  sendPitch(0);
});
document.getElementById('down10').addEventListener('click', () => {
  slider.value = Math.max(-1200, Number(slider.value) - 10);
  sendPitch(Number(slider.value));
});
document.getElementById('down1').addEventListener('click', () => {
  slider.value = Math.max(-1200, Number(slider.value) - 1);
  sendPitch(Number(slider.value));
});
document.getElementById('up1').addEventListener('click', () => {
  slider.value = Math.min(1200, Number(slider.value) + 1);
  sendPitch(Number(slider.value));
});
document.getElementById('up10').addEventListener('click', () => {
  slider.value = Math.min(1200, Number(slider.value) + 10);
  sendPitch(Number(slider.value));
});

// ── エンジン切替 ──
const engJungle = document.getElementById('engJungle');
const engWsola = document.getElementById('engWsola');
const engineNote = document.getElementById('engineNote');

const ENGINE_NOTES = {
  jungle: 'ディレイ式。軽い・低遅延。大きく動かすと微かな揺らぎ',
  wsola: 'SoundTouch(WSOLA)。高音質・揺らぎ少。やや高負荷・遅延あり',
};

function setEngineUI(engine) {
  const isWsola = engine === 'wsola';
  engWsola.classList.toggle('active', isWsola);
  engJungle.classList.toggle('active', !isWsola);
  engineNote.textContent = ENGINE_NOTES[engine] || '';
}

async function sendEngine(engine) {
  setEngineUI(engine);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: 'SET_ENGINE', engine }).catch(() => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }).then(() => {
      chrome.tabs.sendMessage(tab.id, { type: 'SET_ENGINE', engine });
    });
  });
}

engJungle.addEventListener('click', () => sendEngine('jungle'));
engWsola.addEventListener('click', () => sendEngine('wsola'));

// ── 音質強化（EQ / ステレオ拡張）──
const bass = document.getElementById('bass');
const mid = document.getElementById('mid');
const treble = document.getElementById('treble');
const width = document.getElementById('width');
const bassVal = document.getElementById('bassVal');
const midVal = document.getElementById('midVal');
const trebleVal = document.getElementById('trebleVal');
const widthVal = document.getElementById('widthVal');

function fmtDb(v) { return `${v > 0 ? '+' : ''}${v} dB`; }

async function sendToTab(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, message).catch(() => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }).then(() => chrome.tabs.sendMessage(tab.id, message));
  });
}

function sendEQ() {
  bassVal.textContent = fmtDb(Number(bass.value));
  midVal.textContent = fmtDb(Number(mid.value));
  trebleVal.textContent = fmtDb(Number(treble.value));
  sendToTab({
    type: 'SET_EQ',
    eq: { bass: Number(bass.value), mid: Number(mid.value), treble: Number(treble.value) }
  });
}

function sendWidth() {
  const w = Number(width.value) / 100;
  widthVal.textContent = `${width.value}%`;
  sendToTab({ type: 'SET_STEREO', width: w });
}

bass.addEventListener('input', sendEQ);
mid.addEventListener('input', sendEQ);
treble.addEventListener('input', sendEQ);
width.addEventListener('input', sendWidth);

document.getElementById('enhanceReset').addEventListener('click', () => {
  bass.value = 0; mid.value = 0; treble.value = 0; width.value = 100;
  sendEQ();
  sendWidth();
});

// ポップアップ開いた時に現在の状態を取得して表示を合わせる
(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: 'GET_STATE' }, (res) => {
    if (chrome.runtime.lastError || !res) return;
    const cents = Math.round(Math.log2(res.factor) * 1200);
    slider.value = cents;
    updateDisplay(cents);
    setEngineUI(res.engine || 'jungle');

    if (res.eq) {
      bass.value = res.eq.bass ?? 0;
      mid.value = res.eq.mid ?? 0;
      treble.value = res.eq.treble ?? 0;
      bassVal.textContent = fmtDb(Number(bass.value));
      midVal.textContent = fmtDb(Number(mid.value));
      trebleVal.textContent = fmtDb(Number(treble.value));
    }
    if (typeof res.width === 'number') {
      width.value = Math.round(res.width * 100);
      widthVal.textContent = `${width.value}%`;
    }
  });
})();
