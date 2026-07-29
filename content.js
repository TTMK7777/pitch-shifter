// content.js — ページに注入され、再生中メディアのピッチをリアルタイム変更する
//
// 2エンジン切替式:
//   - jungle : Chris Wilson / Google 2012 のグラニュラー・ディレイ式（軽量・ネイティブノードのみ）
//   - wsola  : SoundTouchJS（WSOLA方式）の公式 AudioWorklet（高音質・要 worklet 同梱, LGPL）
//
// createMediaElementSource は要素ごとに1回しか呼べないため、source は保持し、
// 下流（jungle / wsola）の配線だけを張り替えてエンジンを切り替える。

(function () {
  'use strict';

  // ===================================================================
  // エンジン1: Jungle — delay-based pitch shifter
  // Copyright 2012, Google Inc.  (BSD 3-Clause)
  // https://github.com/cwilso/Audio-Input-Effects/blob/master/js/jungle.js
  // ===================================================================

  function createFadeBuffer(context, activeTime, fadeTime) {
    const length1 = activeTime * context.sampleRate;
    const length2 = (activeTime - 2 * fadeTime) * context.sampleRate;
    const length = length1 + length2;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const p = buffer.getChannelData(0);

    const fadeLength = fadeTime * context.sampleRate;
    const fadeIndex1 = fadeLength;
    const fadeIndex2 = length1 - fadeLength;

    for (let i = 0; i < length1; ++i) {
      let value;
      if (i < fadeIndex1) {
        value = Math.sqrt(i / fadeLength);
      } else if (i >= fadeIndex2) {
        value = Math.sqrt(1 - (i - fadeIndex2) / fadeLength);
      } else {
        value = 1;
      }
      p[i] = value;
    }
    for (let i = length1; i < length; ++i) p[i] = 0;
    return buffer;
  }

  function createDelayTimeBuffer(context, activeTime, fadeTime, shiftUp) {
    const length1 = activeTime * context.sampleRate;
    const length2 = (activeTime - 2 * fadeTime) * context.sampleRate;
    const length = length1 + length2;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const p = buffer.getChannelData(0);

    for (let i = 0; i < length1; ++i) {
      if (shiftUp) p[i] = (length1 - i) / length; // シフトアップ
      else p[i] = i / length1;                    // シフトダウン
    }
    for (let i = length1; i < length; ++i) p[i] = 0;
    return buffer;
  }

  const JUNGLE_DELAY_TIME = 0.100;
  const JUNGLE_FADE_TIME = 0.050;
  const JUNGLE_BUFFER_TIME = 0.100;

  function Jungle(context) {
    this.context = context;
    const input = context.createGain();
    const output = context.createGain();
    this.input = input;
    this.output = output;

    const mod1 = context.createBufferSource();
    const mod2 = context.createBufferSource();
    const mod3 = context.createBufferSource();
    const mod4 = context.createBufferSource();
    this.shiftDownBuffer = createDelayTimeBuffer(context, JUNGLE_BUFFER_TIME, JUNGLE_FADE_TIME, false);
    this.shiftUpBuffer = createDelayTimeBuffer(context, JUNGLE_BUFFER_TIME, JUNGLE_FADE_TIME, true);
    mod1.buffer = this.shiftDownBuffer;
    mod2.buffer = this.shiftDownBuffer;
    mod3.buffer = this.shiftUpBuffer;
    mod4.buffer = this.shiftUpBuffer;
    mod1.loop = true; mod2.loop = true; mod3.loop = true; mod4.loop = true;

    const mod1Gain = context.createGain();
    const mod2Gain = context.createGain();
    const mod3Gain = context.createGain(); mod3Gain.gain.value = 0;
    const mod4Gain = context.createGain(); mod4Gain.gain.value = 0;

    mod1.connect(mod1Gain);
    mod2.connect(mod2Gain);
    mod3.connect(mod3Gain);
    mod4.connect(mod4Gain);

    const modGain1 = context.createGain();
    const modGain2 = context.createGain();

    const delay1 = context.createDelay();
    const delay2 = context.createDelay();
    mod1Gain.connect(modGain1);
    mod2Gain.connect(modGain2);
    mod3Gain.connect(modGain1);
    mod4Gain.connect(modGain2);
    modGain1.connect(delay1.delayTime);
    modGain2.connect(delay2.delayTime);

    const fade1 = context.createBufferSource();
    const fade2 = context.createBufferSource();
    const fadeBuffer = createFadeBuffer(context, JUNGLE_BUFFER_TIME, JUNGLE_FADE_TIME);
    fade1.buffer = fadeBuffer;
    fade2.buffer = fadeBuffer;
    fade1.loop = true; fade2.loop = true;

    const mix1 = context.createGain();
    const mix2 = context.createGain();
    mix1.gain.value = 0; mix2.gain.value = 0;

    fade1.connect(mix1.gain);
    fade2.connect(mix2.gain);

    input.connect(delay1);
    input.connect(delay2);
    delay1.connect(mix1);
    delay2.connect(mix2);
    mix1.connect(output);
    mix2.connect(output);

    const t = context.currentTime + 0.050;
    const t2 = t + JUNGLE_BUFFER_TIME - JUNGLE_FADE_TIME;
    mod1.start(t); mod2.start(t2);
    mod3.start(t); mod4.start(t2);
    fade1.start(t); fade2.start(t2);

    this.mod1Gain = mod1Gain;
    this.mod2Gain = mod2Gain;
    this.mod3Gain = mod3Gain;
    this.mod4Gain = mod4Gain;
    this.modGain1 = modGain1;
    this.modGain2 = modGain2;

    this.setDelay(JUNGLE_DELAY_TIME);
  }

  Jungle.prototype.setDelay = function (delayTime) {
    this.modGain1.gain.setTargetAtTime(0.5 * delayTime, this.context.currentTime, 0.010);
    this.modGain2.gain.setTargetAtTime(0.5 * delayTime, this.context.currentTime, 0.010);
  };

  Jungle.prototype.setPitchOffset = function (mult) {
    if (mult > 0) { // ピッチアップ
      this.mod1Gain.gain.value = 0;
      this.mod2Gain.gain.value = 0;
      this.mod3Gain.gain.value = 1;
      this.mod4Gain.gain.value = 1;
    } else { // ピッチダウン
      this.mod1Gain.gain.value = 1;
      this.mod2Gain.gain.value = 1;
      this.mod3Gain.gain.value = 0;
      this.mod4Gain.gain.value = 0;
    }
    this.setDelay(JUNGLE_DELAY_TIME * Math.abs(mult));
  };

  // 半音 → Jungle mult への経験的校正多項式（soundbank-pitch-shift, mmckegg）
  function getMultiplier(x) {
    if (x < 0) return x / 12;
    const a5 = 1.8149080040913423e-7;
    const a4 = -0.000019413043101157434;
    const a3 = 0.0009795096626987743;
    const a2 = -0.014147877819596033;
    const a1 = 0.23005591195033048;
    const a0 = 0.02278153473118749;
    const x2 = x * x, x3 = x2 * x, x4 = x3 * x, x5 = x4 * x;
    return a0 + x * a1 + x2 * a2 + x3 * a3 + x4 * a4 + x5 * a5;
  }

  // ===================================================================
  // 共通: コンテキスト・状態
  // ===================================================================

  let audioCtx = null;
  const elementMap = new Map();     // el → { source, jungle, stNode }
  let currentFactor = 1.0;          // ピッチ係数 (2^(cents/1200))
  let currentEngine = 'jungle';     // 'jungle' | 'wsola'
  let workletReadyPromise = null;

  // 音質強化レイヤー（全要素で共有: engineOut → EQ → ステレオ拡張 → destination）
  const currentEQ = { bass: 0, mid: 0, treble: 0 }; // dB
  let currentWidth = 1.0;            // ステレオ広がり (0=モノ, 1=原音, 2=最大)
  let chainInput = null;             // エンジン出力の合流先
  let bassFilter = null, midFilter = null, trebleFilter = null;
  let widthA = [], widthB = [];      // M/S マトリクス用ゲイン

  function ensureContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function ensureWorklet() {
    if (!workletReadyPromise) {
      workletReadyPromise = (async () => {
        ensureContext();
        const url = chrome.runtime.getURL('soundtouch-worklet.js');
        await audioCtx.audioWorklet.addModule(url);
      })();
    }
    return workletReadyPromise;
  }

  function factorToSemitones(factor) {
    return Math.log2(factor) * 12;
  }

  // ===================================================================
  // 音質強化チェーン（全要素共有・遅延構築）
  //   chainInput → bass(lowshelf) → mid(peaking) → treble(highshelf)
  //             → ステレオワイドナー(M/S マトリクス) → destination
  // ===================================================================

  function ensureChain() {
    if (chainInput) return chainInput;
    ensureContext();
    const ctx = audioCtx;

    chainInput = ctx.createGain();

    bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.value = 200;
    bassFilter.gain.value = currentEQ.bass;

    midFilter = ctx.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 0.9;
    midFilter.gain.value = currentEQ.mid;

    trebleFilter = ctx.createBiquadFilter();
    trebleFilter.type = 'highshelf';
    trebleFilter.frequency.value = 3500;
    trebleFilter.gain.value = currentEQ.treble;

    chainInput.connect(bassFilter);
    bassFilter.connect(midFilter);
    midFilter.connect(trebleFilter);

    // ステレオワイドナー: outL = a·L + b·R, outR = b·L + a·R
    //   a = 0.5(1+width), b = 0.5(1-width)  ⇒ width=1 で原音, 0 でモノ, 2 で最大
    // モノラル音源対策: splitter は discrete アップミックスで R を無音化するため、
    //   手前で speakers アップミックス(L=R 複製)を強制して両ch に音を行き渡らせる。
    const stereoize = ctx.createGain();
    stereoize.channelCount = 2;
    stereoize.channelCountMode = 'explicit';
    stereoize.channelInterpretation = 'speakers';

    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);
    trebleFilter.connect(stereoize);
    stereoize.connect(splitter);

    const gLa = ctx.createGain(); // L → outL (a)
    const gRb = ctx.createGain(); // R → outL (b)
    const gLb = ctx.createGain(); // L → outR (b)
    const gRa = ctx.createGain(); // R → outR (a)

    splitter.connect(gLa, 0); gLa.connect(merger, 0, 0);
    splitter.connect(gRb, 1); gRb.connect(merger, 0, 0);
    splitter.connect(gLb, 0); gLb.connect(merger, 0, 1);
    splitter.connect(gRa, 1); gRa.connect(merger, 0, 1);

    widthA = [gLa, gRa];
    widthB = [gRb, gLb];
    applyStereoWidth(currentWidth);

    merger.connect(ctx.destination);
    return chainInput;
  }

  function setEQ(eq) {
    if (typeof eq.bass === 'number') currentEQ.bass = eq.bass;
    if (typeof eq.mid === 'number') currentEQ.mid = eq.mid;
    if (typeof eq.treble === 'number') currentEQ.treble = eq.treble;
    if (bassFilter) bassFilter.gain.value = currentEQ.bass;
    if (midFilter) midFilter.gain.value = currentEQ.mid;
    if (trebleFilter) trebleFilter.gain.value = currentEQ.treble;
  }

  function applyStereoWidth(width) {
    currentWidth = width;
    const a = 0.5 * (1 + width);
    const b = 0.5 * (1 - width);
    widthA.forEach(g => { g.gain.value = a; });
    widthB.forEach(g => { g.gain.value = b; });
  }

  // ===================================================================
  // ピッチ適用（エンジン別）
  // ===================================================================

  function applyPitchJungle(jungle, factor) {
    const semis = factorToSemitones(factor);
    if (Math.abs(semis) < 0.01) jungle.setPitchOffset(0);
    else jungle.setPitchOffset(getMultiplier(semis));
  }

  function applyPitchWsola(stNode, factor) {
    const clamped = Math.min(4.0, Math.max(0.25, factor));
    stNode.parameters.get('pitch').value = clamped; // factor がそのままピッチ比
  }

  function applyPitchActive(entry, factor) {
    if (currentEngine === 'wsola' && entry.stNode) applyPitchWsola(entry.stNode, factor);
    else if (entry.jungle) applyPitchJungle(entry.jungle, factor);
  }

  // ===================================================================
  // エンジン構築・配線
  // ===================================================================

  function buildJungle(entry) {
    if (!entry.jungle) entry.jungle = new Jungle(audioCtx);
    return entry.jungle;
  }

  async function buildWsola(entry) {
    await ensureWorklet();
    if (!entry.stNode) {
      entry.stNode = new AudioWorkletNode(audioCtx, 'soundtouch-processor', {
        outputChannelCount: [2]
      });
    }
    return entry.stNode;
  }

  // source の下流を全部切って、選択エンジンだけを source → engine → 強化チェーン で繋ぐ
  async function wireEngine(entry, engine) {
    const dest = ensureChain(); // エンジン出力は強化チェーン経由で destination へ
    try { entry.source.disconnect(); } catch (_) {}
    if (entry.jungle) { try { entry.jungle.output.disconnect(); } catch (_) {} }
    if (entry.stNode) { try { entry.stNode.disconnect(); } catch (_) {} }

    if (engine === 'wsola') {
      let node;
      try {
        node = await buildWsola(entry);
      } catch (e) {
        // worklet 読込失敗 → Jungle にフォールバック
        console.warn('[PitchShifter] WSOLA worklet 読込失敗, Jungle にフォールバック:', e.message);
        const j = buildJungle(entry);
        entry.source.connect(j.input);
        j.output.connect(dest);
        applyPitchJungle(j, currentFactor);
        return 'jungle';
      }
      entry.source.connect(node);
      node.connect(dest);
      applyPitchWsola(node, currentFactor);
      return 'wsola';
    } else {
      const j = buildJungle(entry);
      entry.source.connect(j.input);
      j.output.connect(dest);
      applyPitchJungle(j, currentFactor);
      return 'jungle';
    }
  }

  // ===================================================================
  // メディア要素アタッチ
  // ===================================================================

  async function attachElement(el) {
    if (elementMap.has(el)) return;

    ensureContext();
    if (audioCtx.state === 'suspended') {
      try { await audioCtx.resume(); } catch (_) {}
    }

    let source;
    try {
      source = audioCtx.createMediaElementSource(el);
    } catch (e) {
      return; // 既に createMediaElementSource 済み
    }

    const entry = { source, jungle: null, stNode: null };
    elementMap.set(el, entry);
    await wireEngine(entry, currentEngine);
    console.log('[PitchShifter] attached to', el.tagName, '(', currentEngine, ')');
  }

  function attachPlayingElements() {
    document.querySelectorAll('audio, video').forEach(el => {
      if (!el.paused) attachElement(el);
    });
  }

  // ===================================================================
  // 制御
  // ===================================================================

  function updatePitch(factor) {
    currentFactor = factor;
    elementMap.forEach(entry => applyPitchActive(entry, factor));
  }

  async function setEngine(engine) {
    if (engine !== 'jungle' && engine !== 'wsola') return;
    currentEngine = engine;
    for (const entry of elementMap.values()) {
      await wireEngine(entry, engine);
    }
  }

  // ===================================================================
  // イベント / メッセージ
  // ===================================================================

  document.addEventListener('play', e => {
    if (e.target instanceof HTMLMediaElement) attachElement(e.target);
  }, true);

  attachPlayingElements();

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'SET_PITCH') {
      updatePitch(msg.factor);
      attachPlayingElements();
      sendResponse({ ok: true });
    } else if (msg.type === 'SET_ENGINE') {
      setEngine(msg.engine).then(() => sendResponse({ ok: true, engine: currentEngine }));
      attachPlayingElements();
      return true; // 非同期応答
    } else if (msg.type === 'SET_EQ') {
      ensureChain();
      setEQ(msg.eq);
      sendResponse({ ok: true });
    } else if (msg.type === 'SET_STEREO') {
      ensureChain();
      applyStereoWidth(msg.width);
      sendResponse({ ok: true });
    } else if (msg.type === 'GET_STATE') {
      sendResponse({
        factor: currentFactor,
        engine: currentEngine,
        eq: { bass: currentEQ.bass, mid: currentEQ.mid, treble: currentEQ.treble },
        width: currentWidth
      });
    }
    return true;
  });
})();
