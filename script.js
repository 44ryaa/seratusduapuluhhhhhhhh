// ==========================================================================
// GLOBAL STATE & SYSTEM INITIALIZATION
// ==========================================================================

let activeWeather = 'morning';
let activeSeed = 'tulip';
let wateringMode = false;
let isPlayingAudio = false;

// Custom Letter Base64 variables
let customDecryptionKey = null;
let customDecryptionMessage = null;

// Anniversary date initialization
let anniversaryDate = new Date("2025-06-06T00:00:00");

// Web Audio API context and nodes
let audioCtx = null;
let bgPadOscNode = null;
let bgPadGainNode = null;
let arpeggioInterval = null;
let musicScheduleTimeout = null;

// Custom letter variables (Mailbox)
let lettersUnread = true;

// ==========================================================================
// SYSTEM ENTRY POINT
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
  // Load anniversary date from storage or write default
  const storedDate = localStorage.getItem("meadow_love_date");
  if (storedDate) {
    anniversaryDate = new Date(storedDate);
  } else {
    localStorage.setItem("meadow_love_date", anniversaryDate.toISOString().split('T')[0]);
  }
  
  document.getElementById('anniversary-date').value = anniversaryDate.toISOString().split('T')[0];
  
  // Bind UI control listeners
  setupEventListeners();
  
  // Parse any base64 shared letter from URL
  parseSharedLetterURL();
  
  // Setup the interactive canvas
  initMeadowCanvas();
  
  // Start the timers
  updateAnniversaryTimer();
  setInterval(updateAnniversaryTimer, 1000);
});

// Unlock Web Audio API on first mobile interaction
function unlockAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.warn("Web Audio API not supported:", e);
  }
}
['click', 'touchstart'].forEach(evt => {
  window.addEventListener(evt, unlockAudio, { once: true });
});

// ==========================================================================
// EVENT LISTENERS BINDINGS
// ==========================================================================
function setupEventListeners() {
  // Toggle date customizer collapse
  const toggleBtn = document.getElementById('customizerToggleBtn');
  const panel = document.getElementById('customizerPanel');
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('show');
    playPopSound(500, 'sine', 0.05, 0.1);
  });

  // Anniversary date picker input
  const dateInput = document.getElementById('anniversary-date');
  dateInput.addEventListener('change', (e) => {
    if (e.target.value) {
      anniversaryDate = new Date(e.target.value + "T00:00:00");
      localStorage.setItem("meadow_love_date", e.target.value);
      playPopSound(660, 'sine', 0.08, 0.25);
      updateAnniversaryTimer();
    }
  });

  // Background Music Toggle (windmill click)
  const musicBtn = document.getElementById('musicBtn');
  musicBtn.addEventListener('click', () => {
    toggleMusic();
  });
}

// ==========================================================================
// ANNIVERSARY COUNTER TIMER
// ==========================================================================
function updateAnniversaryTimer() {
  const now = new Date();
  const diffMs = now.getTime() - anniversaryDate.getTime();
  
  if (diffMs < 0) {
    // Anniversary in future (countdown mode)
    document.getElementById('time-days').innerText = "0";
    document.getElementById('time-hours').innerText = "0";
    document.getElementById('time-mins').innerText = "0";
    document.getElementById('time-secs').innerText = "0";
    return;
  }
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  document.getElementById('time-days').innerText = days;
  document.getElementById('time-hours').innerText = hours;
  document.getElementById('time-mins').innerText = mins;
  document.getElementById('time-secs').innerText = secs;
}

// ==========================================================================
// WEATHER / TIME OF DAY ENGINE
// ==========================================================================
function setWeather(weatherMode) {
  if (activeWeather === weatherMode) return;
  activeWeather = weatherMode;
  
  // Play soft transition tone
  playPopSound(300, 'sine', 0.05, 0.3);
  setTimeout(() => playPopSound(450, 'sine', 0.05, 0.3), 80);
  
  // Remove all active states from weather buttons
  document.querySelectorAll('.weather-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`w-${weatherMode}`).classList.add('active');
  
  // Apply environment CSS classes on HTML body
  document.body.className = `weather-${weatherMode}`;
  
  // Dynamically set CSS variables values
  const root = document.documentElement;
  if (weatherMode === 'morning') {
    root.style.setProperty('--sky-top', 'var(--morning-sky-top)');
    root.style.setProperty('--sky-bottom', 'var(--morning-sky-bottom)');
    root.style.setProperty('--grass-light', 'var(--morning-grass-light)');
    root.style.setProperty('--grass-dark', 'var(--morning-grass-dark)');
    root.style.setProperty('--ambient-light', 'var(--morning-light)');
  } else if (weatherMode === 'sunny') {
    root.style.setProperty('--sky-top', 'var(--sunny-sky-top)');
    root.style.setProperty('--sky-bottom', 'var(--sunny-sky-bottom)');
    root.style.setProperty('--grass-light', 'var(--sunny-grass-light)');
    root.style.setProperty('--grass-dark', 'var(--sunny-grass-dark)');
    root.style.setProperty('--ambient-light', 'var(--sunny-light)');
  } else if (weatherMode === 'sunset') {
    root.style.setProperty('--sky-top', 'var(--sunset-sky-top)');
    root.style.setProperty('--sky-bottom', 'var(--sunset-sky-bottom)');
    root.style.setProperty('--grass-light', 'var(--sunset-grass-light)');
    root.style.setProperty('--grass-dark', 'var(--sunset-grass-dark)');
    root.style.setProperty('--ambient-light', 'var(--sunset-light)');
  } else if (weatherMode === 'night') {
    root.style.setProperty('--sky-top', 'var(--night-sky-top)');
    root.style.setProperty('--sky-bottom', 'var(--night-sky-bottom)');
    root.style.setProperty('--grass-light', 'var(--night-grass-light)');
    root.style.setProperty('--grass-dark', 'var(--night-grass-dark)');
    root.style.setProperty('--ambient-light', 'var(--night-light)');
  }
  
  // Trigger transitions inside canvas (fireflies and color palettes)
  triggerCanvasWeatherTransition();
}

// ==========================================================================
// INTERACTIVE ANIMALS ENGINE
// ==========================================================================
const animalQuotes = {
  sheep: [
    "Mbee~ Sayang kamu sampai ujung padang rumput! 🐏💖",
    "Kamu manis banget hari ini! Jadi pengen meluk... 🥰",
    "Sudah makan belum sayang? Jangan telat makan yaa! 🥦",
    "Pipi kamu kelihatannya empuk banget kayak buluku! Hahaha! 🐑",
    "Udah minum air putih belum manis? Minum dulu gih! 💧",
    "Breezee-nya segar banget ya! Melompat-lompat gembira! ✨"
  ],
  bunny: [
    "Hop! Ada wortel rahasia di hatiku khusus buat kamu! 🐰🥕",
    "Jangan sedih ya sayang! Sini aku wiggling telingaku buat kamu! 🐰",
    "Aku selalu lompat kegirangan tiap kali kamu buka web ini! 😍",
    "Kamu adalah bunga tercantik di taman buatan kita ini! 🌸",
    "Biarin aku jagain padang rumput ini biar kamu selalu senang! 🍀",
    "Hop hop! Semangat terus buat semua aktivitas kamu ya sayang! ❤️"
  ]
};

let animalBubbleTimeout = { sheep: null, bunny: null };

function triggerAnimal(animalType) {
  const element = document.getElementById(animalType);
  if (!element) return;
  
  // Prevent spam clicks during animation
  if (element.classList.contains('jump')) return;
  element.classList.add('jump');
  
  // For bunny, wiggle ears too
  if (animalType === 'bunny') {
    element.classList.add('wiggle');
  }
  
  // Play procedural sounds
  if (animalType === 'sheep') {
    playSheepSound();
  } else {
    playBunnySound();
  }
  
  // Choose random quote
  const quotes = animalQuotes[animalType];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  
  // Show dialogue bubble
  const bubble = document.getElementById(`${animalType}Bubble`);
  bubble.innerText = randomQuote;
  bubble.classList.add('show');
  
  // Spawn floating heart particles on tap
  spawnFloatingHearts(element);

  // Clear existing timeouts
  if (animalBubbleTimeout[animalType]) {
    clearTimeout(animalBubbleTimeout[animalType]);
  }
  
  // Hide bubble and remove classes
  setTimeout(() => {
    element.classList.remove('jump');
    element.classList.remove('wiggle');
  }, 500);

  animalBubbleTimeout[animalType] = setTimeout(() => {
    bubble.classList.remove('show');
  }, 4500);
}

function spawnFloatingHearts(animalElement) {
  const rect = animalElement.getBoundingClientRect();
  const count = 3 + Math.floor(Math.random() * 3);
  
  for (let i = 0; i < count; i++) {
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.innerText = Math.random() > 0.5 ? '❤️' : '💖';
    
    // Position near the top of the animal
    heart.style.left = `${rect.left + rect.width / 2 + (Math.random() - 0.5) * 30}px`;
    heart.style.top = `${rect.top}px`;
    
    // Random velocity angle
    const dirX = (Math.random() - 0.5) * 2;
    heart.style.setProperty('--dirX', dirX);
    
    document.body.appendChild(heart);
    
    // Self-destruct after animation completes
    setTimeout(() => heart.remove(), 1000);
  }
}

// ==========================================================================
// VIRTUAL GARDENING ENGINE (TAMAN BUNGA KITA)
// ==========================================================================
const flowerTypes = {
  tulip: { icon: '🌷', name: 'Tulip Cinta', meaning: 'Mekar! Cinta kita abadi! 🌷❤️' },
  daisy: { icon: '🌼', name: 'Daisy Ceria', meaning: 'Mekar! Senyumanmu duniaku! 🌼😊' },
  lavender: { icon: '🪻', name: 'Lavender Damai', meaning: 'Mekar! Kamu ketenanganku! 🪻💤' },
  clover: { icon: '🍀', name: 'Semanggi 4 Daun', meaning: 'Beruntung! Aku beruntung memilikimu! 🍀⭐' }
};

let gardenFlowers = [];
// Load previous garden if any
try {
  const savedGarden = localStorage.getItem("meadow_garden");
  if (savedGarden) {
    gardenFlowers = JSON.parse(savedGarden);
  }
} catch(e) {
  gardenFlowers = [];
}

function selectSeed(seedType) {
  activeSeed = seedType;
  wateringMode = false;
  
  // Update UI button actives
  document.querySelectorAll('.seed-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`seed-${seedType}`).classList.add('active');
  document.getElementById('wateringBtn').classList.remove('active');
  
  // Update HUD text
  document.getElementById('gardenInstructions').innerHTML = 
    `Ketuk area kosong di rumput untuk menanam benih <strong>${flowerTypes[seedType].name}</strong>!`;
  
  playPopSound(400, 'sine', 0.05, 0.15);
}

function toggleWateringCan() {
  wateringMode = !wateringMode;
  
  const wBtn = document.getElementById('wateringBtn');
  if (wateringMode) {
    wBtn.classList.add('active');
    document.getElementById('gardenInstructions').innerHTML = 
      `Mode penyiraman aktif! 🚿 Ketuk kuncup bunga di rumput untuk menyiramnya.`;
    playPopSound(600, 'triangle', 0.05, 0.2);
  } else {
    wBtn.classList.remove('active');
    selectSeed(activeSeed);
  }
}

// Save garden layout helper
function saveGardenState() {
  localStorage.setItem("meadow_garden", JSON.stringify(gardenFlowers));
}

// Check flower clicked helper
function getFlowerAt(clickX, clickY) {
  // Check collision circle
  const hitRadius = 24;
  for (let i = 0; i < gardenFlowers.length; i++) {
    const fl = gardenFlowers[i];
    const dx = clickX - fl.x;
    const dy = clickY - fl.y;
    if (Math.sqrt(dx*dx + dy*dy) < hitRadius) {
      return fl;
    }
  }
  return null;
}

// Plant seed action
function plantSeed(x, y) {
  if (gardenFlowers.length >= 15) {
    // Auto harvest/clear the oldest flower to prevent memory clutter
    gardenFlowers.shift();
  }
  
  const newFlower = {
    id: Date.now() + Math.random(),
    x: x,
    y: y,
    type: activeSeed,
    growth: 0, // 0 = seed, 1 = sprout, 2 = bud, 3 = fully bloomed
    scale: 0.1,
    wateredCount: 0,
    plantedTime: Date.now()
  };
  
  gardenFlowers.push(newFlower);
  saveGardenState();
  
  // Play sound
  playPopSound(260, 'triangle', 0.1, 0.15);
  setTimeout(() => playPopSound(340, 'triangle', 0.08, 0.2), 60);
  
  // Spawn little planting dirt particles inside canvas
  spawnDirtParticles(x, y);
}

// Water flower action
function waterFlower(flower) {
  if (flower.growth >= 3) {
    // Already fully grown! Just trigger a sparkle
    playWaterSplashSound();
    spawnWaterParticles(flower.x, flower.y);
    showFlowerPopover(flower);
    return;
  }
  
  flower.wateredCount++;
  playWaterSplashSound();
  spawnWaterParticles(flower.x, flower.y);
  
  // Increment growth stage
  flower.growth++;
  saveGardenState();
  
  // If grew to next stage, play magical flourish
  if (flower.growth === 3) {
    setTimeout(() => {
      playMagicalSparkleSound();
      spawnSparkleParticles(flower.x, flower.y);
      showFlowerPopover(flower);
    }, 300);
  } else {
    setTimeout(() => {
      playPopSound(500 + (flower.growth * 100), 'sine', 0.06, 0.2);
    }, 150);
  }
}

// Flower popover UI balloon
let activePopoverTimeout = null;
function showFlowerPopover(flower) {
  const popover = document.createElement('div');
  popover.className = 'flower-popover';
  popover.innerHTML = flowerTypes[flower.type].meaning;
  
  // Position above the flower on screen
  popover.style.left = `${flower.x}px`;
  popover.style.top = `${flower.y - 30}px`;
  
  document.body.appendChild(popover);
  
  // trigger animation
  setTimeout(() => popover.classList.add('show'), 20);
  
  setTimeout(() => {
    popover.classList.remove('show');
    setTimeout(() => popover.remove(), 300);
  }, 3000);
}

// ==========================================================================
// MAILBOX & LOVE LETTERS SYSTEM
// ==========================================================================
function openMailbox() {
  const modal = document.getElementById('mailboxModal');
  modal.classList.add('show');
  
  // Mark letters as read
  lettersUnread = false;
  const mBox = document.getElementById('loveMailbox');
  mBox.classList.remove('unread');
  
  playPopSound(440, 'sine', 0.08, 0.2);
  setTimeout(() => playPopSound(660, 'sine', 0.06, 0.15), 85);
}

function closeMailbox() {
  const modal = document.getElementById('mailboxModal');
  modal.classList.remove('show');
  playPopSound(250, 'sine', 0.06, 0.3);
}

function switchMailTab(tabId) {
  // Update Tab buttons
  document.querySelectorAll('.mailbox-tab-btn').forEach(btn => btn.classList.remove('active'));
  // Find which button triggered this
  const tabs = document.querySelectorAll('.mailbox-tab-btn');
  const indexMap = { 'letter1': 0, 'letter2': 1, 'letter3': 2, 'letter4': 3 };
  tabs[indexMap[tabId]].classList.add('active');
  
  // Show active letter pane
  document.querySelectorAll('.letter-content').forEach(pane => pane.classList.remove('active'));
  document.getElementById(`mail-${tabId}`).classList.add('active');
  
  playPopSound(400, 'sine', 0.04, 0.15);
}

// Letters Encryption Form collapsible toggle
function toggleEncryptSection() {
  const sect = document.getElementById('encryptFieldsSection');
  const btn = document.getElementById('toggleEncryptFormBtn');
  if (sect.style.display === 'none' || !sect.style.display) {
    sect.style.display = 'flex';
    btn.innerText = 'Tutup Formulir Kustomisasi ⚙️';
  } else {
    sect.style.display = 'none';
    btn.innerText = 'Buat Transmisi Rahasia ⚙️';
  }
  playPopSound(300, 'sine', 0.05, 0.1);
}

// Mail Decryption Terminal
let decryptingLetter = false;
const letterSecretText = `PESAN RAHASIA TERDEKRIPSI... 🍀🔑\n\n=========================================\nDARIPADA: PASANGAN HIDUPMU\nUNTUK: BELAHAN JIWAKU\nSTATUS: TERKONEKSI SEMPURNA\n=========================================\n\nHai Sayangku! ✨\n\nKalau kamu berhasil membaca pesan terenkripsi ini, berarti kamu sudah tahu kalau cinta kita terkunci rapat! 🔓💖\n\nMeskipun duniaku luas seperti padang rumput, hatiku cuma menetap di satu koordinat saja: KAMU. Terima kasih ya sudah menjadi teman hidup yang sangat sabar, pengertian, dan selalu sukses bikin aku bahagia tiap hari.\n\nAku janji akan selalu menjagamu, menyayangimu, dan menyirami hubungan kita dengan tawa tiap hari seperti bunga-bunga di taman kita ini.\n\nAku sayang kamu selalu dan selamanya! 🍀🌸❤️`;

function handleLetterDecryption(e) {
  e.preventDefault();
  if (decryptingLetter) return;
  
  const inputVal = document.getElementById('decryptKey').value.trim().toLowerCase();
  const outDiv = document.getElementById('decryptOutput');
  
  const validPasswords = ['sayang', 'nana', 'cinta', 'love', 'manis', 'ayang', 'pacar', 'cantik', 'chubby', 'gemes'];
  
  let correct = false;
  let text = letterSecretText;
  
  if (customDecryptionKey) {
    if (inputVal === customDecryptionKey) {
      correct = true;
      text = `PESAN RAHASIA KHUSUS TERDEKRIPSI... 🍀🔑\n\n=========================================\nDARIPADA: ORANG SPESIALMU\nUNTUK: KESAYANGANKU\nSTATUS: TERKONEKSI SEMPURNA\n=========================================\n\n${customDecryptionMessage}`;
    }
  } else {
    if (validPasswords.includes(inputVal)) {
      correct = true;
    }
  }
  
  if (correct) {
    decryptingLetter = true;
    document.getElementById('decryptForm').style.display = 'none';
    outDiv.classList.add('show');
    outDiv.innerHTML = '';
    
    // Play hum sound
    playPopSound(110, 'sawtooth', 0.15, 0.6);
    
    let charIdx = 0;
    const speed = 25;
    
    function typeChar() {
      if (charIdx < text.length) {
        const c = text.charAt(charIdx);
        outDiv.innerHTML += c;
        
        // Random tick audio
        if (charIdx % 4 === 0 && c !== ' ' && c !== '\n') {
          playPopSound(800 + Math.random() * 400, 'sine', 0.005, 0.05);
        }
        
        charIdx++;
        setTimeout(typeChar, speed);
      } else {
        outDiv.innerHTML += '<span class="cursor">|</span>';
        decryptingLetter = false;
        playMagicalSparkleSound();
        spawnSparkleParticles(window.innerWidth / 2, window.innerHeight / 2);
      }
    }
    typeChar();
  } else {
    // Fail sound
    playPopSound(130, 'sawtooth', 0.2, 0.45);
    const err = document.createElement('div');
    err.style.color = '#ff7675';
    err.style.marginTop = '6px';
    err.innerText = `DECRYPTION FAIL: Kode "${inputVal}" salah. Kunci magnetik clover ditolak.`;
    document.getElementById('decryptForm').appendChild(err);
    setTimeout(() => err.remove(), 2500);
  }
}

// Generate URL share code
function generateSecretLetterLink() {
  const key = document.getElementById('customKey').value.trim().toLowerCase();
  const msg = document.getElementById('customMessage').value.trim();
  
  if (!key || !msg) {
    alert("Mohon isi kata sandi dan pesan rahasianya dulu ya!");
    return;
  }
  
  // Base64 encode safe for emojis
  const encodedKey = btoa(unescape(encodeURIComponent(key)));
  const encodedMsg = btoa(unescape(encodeURIComponent(msg)));
  
  const currentURL = window.location.origin + window.location.pathname;
  const shareLink = `${currentURL}?key=${encodedKey}&msg=${encodedMsg}`;
  
  const resDiv = document.getElementById('encryptLinkResult');
  resDiv.style.display = 'block';
  resDiv.innerHTML = `Tautan berhasil dibuat! Menyalin ke clipboard... <br><br><strong>${shareLink}</strong>`;
  
  // Copy to clipboard
  navigator.clipboard.writeText(shareLink).then(() => {
    playPopSound(580, 'sine', 0.08, 0.25);
    alert("Tautan disalin ke clipboard! Bagikan tautan ini ke pacarmu. 😉");
  }).catch(() => {
    alert("Penyalinan otomatis gagal. Silakan salin teks tebal di atas manual ya!");
  });
}

function parseSharedLetterURL() {
  const params = new URLSearchParams(window.location.search);
  const keyVal = params.get('key');
  const msgVal = params.get('msg');
  
  if (keyVal && msgVal) {
    try {
      customDecryptionKey = decodeURIComponent(escape(atob(keyVal))).trim().toLowerCase();
      customDecryptionMessage = decodeURIComponent(escape(atob(msgVal)));
      
      // Raise mailbox flag immediately to denote new secret letter available
      lettersUnread = true;
      const mBox = document.getElementById('loveMailbox');
      mBox.classList.add('unread');
      
      // Switch active tab in mailbox modal to tab 4 automatically
      switchMailTab('letter4');
    } catch(e) {
      console.error("Gagal mendecode pesan rahasia:", e);
    }
  }
}

// ==========================================================================
// PROCEDURAL AUDIO SYNTHESIZER (WEB AUDIO API)
// ==========================================================================
function toggleMusic() {
  unlockAudio();
  if (!audioCtx) return;
  
  const btn = document.getElementById('musicBtn');
  
  if (isPlayingAudio) {
    // Mute
    isPlayingAudio = false;
    btn.classList.remove('playing');
    stopAmbientSynth();
  } else {
    // Play
    isPlayingAudio = true;
    btn.classList.add('playing');
    startAmbientSynth();
  }
}

function startAmbientSynth() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  // Chord Progression: Gmaj7, Em7, Cmaj7, D11
  const chordProg = [
    [196.00, 246.94, 293.66, 381.99], // Gmaj7 (G3, B3, D4, F#4)
    [164.81, 196.00, 246.94, 329.63], // Em7 (E3, G3, B3, E4)
    [130.81, 196.00, 246.94, 261.63], // Cmaj7 (C3, G3, B3, C4)
    [146.83, 220.00, 293.66, 349.23]  // D11 (D3, A3, D4, F4)
  ];
  
  let currentChordIdx = 0;
  
  // Pluck instrument arpeggiator notes (Kalimba feel)
  const arpScales = [293.66, 329.63, 392.00, 440.00, 587.33, 659.25, 783.99]; // G Pentatonic
  
  function playChordLoop() {
    if (!isPlayingAudio) return;
    const chord = chordProg[currentChordIdx];
    
    // Play structural pad notes
    chord.forEach((freq, idx) => {
      // Stagger slightly for soft attack arpeggio feel
      musicScheduleTimeout = setTimeout(() => {
        if (!isPlayingAudio) return;
        playPadNode(freq, 4.5);
      }, idx * 180);
    });
    
    // Random cute bell plucks overlay
    let bellCount = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < bellCount; i++) {
      const delay = 1000 + i * 650 + Math.random() * 200;
      musicScheduleTimeout = setTimeout(() => {
        if (!isPlayingAudio) return;
        const randomNote = arpScales[Math.floor(Math.random() * arpScales.length)];
        playKalimbaPluck(randomNote, 0.02 + Math.random() * 0.02);
      }, delay);
    }
    
    currentChordIdx = (currentChordIdx + 1) % chordProg.length;
    
    // Loop chord every 6 seconds
    musicScheduleTimeout = setTimeout(playChordLoop, 6000);
  }
  
  playChordLoop();
}

function stopAmbientSynth() {
  if (musicScheduleTimeout) {
    clearTimeout(musicScheduleTimeout);
  }
}

// Gentle Ambient pad synthesizer
function playPadNode(frequency, duration) {
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, audioCtx.currentTime);
    
    // Envelope: slow rise and slow fade
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 1.2);
    gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime + duration - 1.2);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch(e) {}
}

// Music box plucking synthesizer
function playKalimbaPluck(frequency, volume) {
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    // Instant attack, logarithmic release decay
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.85);
  } catch(e) {}
}

// Sound effects utilities
function playPopSound(freq, type = 'sine', volume = 0.05, duration = 0.1) {
  try {
    unlockAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration + 0.05);
  } catch(e) {}
}

function playSheepSound() {
  try {
    unlockAudio();
    if (!audioCtx) return;
    
    const baseFreq = 220; // A3
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const vibrato = audioCtx.createOscillator();
    const vibratoGain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
    
    // Sheep vibrato / bleat modulation
    vibrato.type = 'sine';
    vibrato.frequency.setValueAtTime(14, audioCtx.currentTime); // Hz frequency
    vibratoGain.gain.setValueAtTime(15, audioCtx.currentTime); // Depth
    
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
    
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    vibrato.start();
    osc.start();
    
    vibrato.stop(audioCtx.currentTime + 0.5);
    osc.stop(audioCtx.currentTime + 0.5);
  } catch(e) {}
}

function playBunnySound() {
  try {
    unlockAudio();
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    // Frequency sweep upward (hop SFX)
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(550, audioCtx.currentTime + 0.25);
    
    gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch(e) {}
}

function playWaterSplashSound() {
  // Simulates splash noise
  try {
    unlockAudio();
    if (!audioCtx) return;
    
    const duration = 0.3;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + duration);
    
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    noiseNode.start();
    noiseNode.stop(audioCtx.currentTime + duration + 0.05);
  } catch(e) {}
}

function playMagicalSparkleSound() {
  try {
    unlockAudio();
    if (!audioCtx) return;
    
    const time = audioCtx.currentTime;
    const plucks = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
    
    plucks.forEach((note, index) => {
      setTimeout(() => {
        playPopSound(note, 'sine', 0.05, 0.3);
      }, index * 60);
    });
  } catch(e) {}
}

// ==========================================================================
// INTERACTIVE MEADOW CANVAS PHYSICS & RENDERING (60 FPS)
// ==========================================================================
let canvas, ctx;
let grassBlades = [];
let windForce = 0;
let windTarget = 0.05;
let animationTime = 0;

// Particles list
let petalParticles = [];
let rainWaterParticles = [];
let dirtParticles = [];
let magicalSparkles = [];
let ambientFireflies = [];

// Touch drag swipe tracking variables
let touchStartX = 0;
let touchStartY = 0;
let isSwiping = false;

function initMeadowCanvas() {
  canvas = document.getElementById('meadowCanvas');
  ctx = canvas.getContext('2d');
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Set touch sweep listeners specifically for wind drag gestures
  canvas.addEventListener('touchstart', handleCanvasTouchStart, { passive: true });
  canvas.addEventListener('touchmove', handleCanvasTouchMove, { passive: true });
  canvas.addEventListener('touchend', handleCanvasTouchEnd, { passive: true });
  
  // Support desktop mouse swipe too
  canvas.addEventListener('mousedown', handleCanvasMouseDown);
  window.addEventListener('mousemove', handleCanvasMouseMove);
  window.addEventListener('mouseup', handleCanvasMouseUp);
  
  // Initialize fireflies
  for (let i = 0; i < 15; i++) {
    ambientFireflies.push({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height * 0.7),
      radius: Math.random() * 2.5 + 1.5,
      angleX: Math.random() * Math.PI * 2,
      angleY: Math.random() * Math.PI * 2,
      speedX: 0.02 + Math.random() * 0.02,
      speedY: 0.02 + Math.random() * 0.02,
      rangeX: 20 + Math.random() * 30,
      rangeY: 20 + Math.random() * 30,
      alpha: 0,
      targetAlpha: activeWeather === 'sunset' || activeWeather === 'night' ? Math.random() * 0.7 + 0.3 : 0
    });
  }
  
  // Start drawing render loop
  requestAnimationFrame(renderLoop);
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  
  // Re-generate responsive grass blades aligned to hills
  generateGrass();
}

function generateGrass() {
  grassBlades = [];
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Generate 160 blades divided among 3 depth layers
  const bladeCount = Math.min(180, Math.floor(width * 0.45)); // Scale with screen width
  
  for (let i = 0; i < bladeCount; i++) {
    const layer = Math.random() > 0.6 ? 2 : (Math.random() > 0.45 ? 1 : 0); // 0 = furthest back, 2 = closest
    const xPct = Math.random();
    
    // Find height base depending on hill equation (bezier curve approximations)
    const baseH = getHillHeightAt(xPct, layer);
    
    grassBlades.push({
      xPct: xPct,
      yPct: baseH / height,
      layer: layer, // Back, Middle, Front
      height: 16 + Math.random() * 20 + (layer * 8), // closer is bigger
      width: 2 + Math.random() * 2,
      swayRange: 0.15 + Math.random() * 0.1,
      swaySpeed: 0.03 + Math.random() * 0.04 - (layer * 0.01),
      phaseOffset: Math.random() * Math.PI * 2,
      colorOffset: Math.random() * 15 - 7.5 // slight deviation in tone
    });
  }
  
  // Sort blades so back layer draws first (painter's algorithm)
  grassBlades.sort((a, b) => a.layer - b.layer);
}

// Parallax hills equation
function getHillHeightAt(xPct, layer) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const x = xPct * width;
  
  // Hill curve offsets
  if (layer === 0) { // Furthest back
    return height * 0.62 + Math.sin(x * 0.003) * 35 + Math.cos(x * 0.001) * 20;
  } else if (layer === 1) { // Middle
    return height * 0.70 + Math.sin(x * 0.005 + 1.5) * 45;
  } else { // Front Hill
    return height * 0.77 + Math.cos(x * 0.004 + 0.8) * 30 + Math.sin(x * 0.002) * 15;
  }
}

function triggerCanvasWeatherTransition() {
  // Update fireflies opacity goals
  ambientFireflies.forEach(fire => {
    fire.targetAlpha = activeWeather === 'sunset' || activeWeather === 'night' 
      ? Math.random() * 0.7 + 0.3 
      : 0;
  });
  
  // If moving to sunny/morning, clear old night sparks, spawn butterflies
  if (activeWeather === 'morning' || activeWeather === 'sunny') {
    petalParticles = petalParticles.slice(0, 4); // retain small amount
  }
}

// ==========================================================
// SWIPE AND TAP GESTURE CAPTURING
// ==========================================================
function handleCanvasTouchStart(e) {
  if (e.touches.length > 0) {
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    
    // Check if clicked a flower first to water it
    if (checkAndHandleFlowerTap(x, y)) return;
    
    touchStartX = x;
    touchStartY = y;
    isSwiping = true;
  }
}

function handleCanvasTouchMove(e) {
  if (!isSwiping || e.touches.length === 0) return;
  const currentX = e.touches[0].clientX;
  const diffX = currentX - touchStartX;
  
  // Set target wind pressure based on drag direction
  windTarget = diffX * 0.003;
  
  // Spawn wind petal streaks in drag direction
  if (Math.abs(diffX) > 15 && Math.random() < 0.25) {
    spawnWindPetal(currentX, e.touches[0].clientY, diffX > 0 ? 3 : -3);
  }
}

function handleCanvasTouchEnd(e) {
  isSwiping = false;
  // Let wind decay slowly
}

// Mouse controls compatibility (Desktop debugging)
let isMouseDown = false;
function handleCanvasMouseDown(e) {
  // Check if clicked flower
  if (checkAndHandleFlowerTap(e.clientX, e.clientY)) return;
  
  touchStartX = e.clientX;
  touchStartY = e.clientY;
  isMouseDown = true;
}

function handleCanvasMouseMove(e) {
  if (!isMouseDown) return;
  const diffX = e.clientX - touchStartX;
  windTarget = diffX * 0.0035;
  
  if (Math.abs(diffX) > 15 && Math.random() < 0.2) {
    spawnWindPetal(e.clientX, e.clientY, diffX > 0 ? 3.5 : -3.5);
  }
}

function handleCanvasMouseUp(e) {
  isMouseDown = false;
}

function checkAndHandleFlowerTap(clickX, clickY) {
  const flower = getFlowerAt(clickX, clickY);
  
  if (flower) {
    if (wateringMode) {
      waterFlower(flower);
    } else {
      // Just tap details/sparkle
      playPopSound(440 + (flower.growth * 80), 'sine', 0.05, 0.2);
      spawnSparkleParticles(flower.x, flower.y);
      showFlowerPopover(flower);
    }
    return true;
  }
  
  // If not tapping a flower, and we are NOT in watering mode, plant a flower seed at the spot!
  // Restriction: only plant on the grass hill surface (lower part of screen)
  const groundBoundary = getHillHeightAt(clickX / window.innerWidth, 1);
  if (!wateringMode && clickY > groundBoundary - 10 && clickY < window.innerHeight - 80) {
    plantSeed(clickX, clickY);
    return true;
  }
  
  return false;
}

// ==========================================================
// PARTICLE GENERATORS
// ==========================================================
function spawnWindPetal(x, y, windSpeedX) {
  petalParticles.push({
    x: x,
    y: y,
    vx: windSpeedX + (Math.random() - 0.5) * 1,
    vy: (Math.random() - 0.5) * 1.5 - 0.5,
    size: 6 + Math.random() * 5,
    rotation: Math.random() * Math.PI,
    rotSpeed: (Math.random() - 0.5) * 0.05,
    alpha: 0.85,
    color: Math.random() > 0.5 ? '#ffb8d1' : (Math.random() > 0.5 ? '#feca57' : '#fd79a8') // Pink, yellow, blossom
  });
}

function spawnWaterParticles(x, y) {
  for (let i = 0; i < 12; i++) {
    rainWaterParticles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y - 35 - Math.random() * 20,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 2 + Math.random() * 3,
      size: 2 + Math.random() * 2,
      alpha: 1,
      targetY: y + 2
    });
  }
}

function spawnDirtParticles(x, y) {
  for (let i = 0; i < 10; i++) {
    dirtParticles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 3,
      vy: -1 - Math.random() * 2,
      gravity: 0.15,
      size: 2.5 + Math.random() * 3,
      alpha: 1,
      color: Math.random() > 0.4 ? '#8d5b4c' : '#522709'
    });
  }
}

function spawnSparkleParticles(x, y) {
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 2.5;
    magicalSparkles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      size: 2.5 + Math.random() * 3,
      alpha: 1,
      fadeRate: 0.02 + Math.random() * 0.02,
      color: Math.random() > 0.5 ? '#55efc4' : (Math.random() > 0.5 ? '#ffeaa7' : '#eccc68') // Green / yellow sparkles
    });
  }
}

// ==========================================================
// RENDER LOOP ENGINE (60 FPS CANVAS DRAWINGS)
// ==========================================================
function renderLoop() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  ctx.clearRect(0, 0, width, height);
  animationTime += 0.02;
  
  // 1. Interpolate wind forces gently
  windForce += (windTarget - windForce) * 0.06;
  // Natural wind float fluctuation
  windTarget += (0.04 - windTarget) * 0.02;
  
  // 2. Draw Layered Parallax Grass Hills
  drawHillLayer(0); // Furthest back hill (Darkest green)
  drawHillLayer(1); // Middle hill
  
  // 3. Draw Grown Flowers & Plant Seeds
  drawFlowers(ctx);
  
  // 4. Draw Front Hill Layer
  drawHillLayer(2); // Front hill (Lighter green)
  
  // 5. Update and draw Grass Blades
  drawGrassBlades(ctx, width, height);
  
  // 6. Update and Draw Particles
  updateAndDrawParticles(ctx);
  
  // 7. Update and Draw Fireflies (ambient night particles)
  updateAndDrawFireflies(ctx);
  
  // Repeat Loop
  requestAnimationFrame(renderLoop);
}

function drawHillLayer(layerIdx) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  ctx.beginPath();
  ctx.moveTo(0, height);
  
  // Draw curve of hill using 15 subdivisions for perfect smoothness
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const pct = i / steps;
    const px = pct * width;
    const py = getHillHeightAt(pct, layerIdx);
    ctx.lineTo(px, py);
  }
  
  ctx.lineTo(width, height);
  ctx.closePath();
  
  // Set gradient coloring based on active weather mode
  let grad = ctx.createLinearGradient(0, height * 0.6, 0, height);
  let c1, c2;
  
  if (activeWeather === 'morning') {
    c1 = layerIdx === 0 ? '#485e30' : (layerIdx === 1 ? '#38a169' : '#4cd137');
    c2 = '#1b4d3e';
  } else if (activeWeather === 'sunny') {
    c1 = layerIdx === 0 ? '#27ae60' : (layerIdx === 1 ? '#2ecc71' : '#55efc4');
    c2 = '#16a085';
  } else if (activeWeather === 'sunset') {
    c1 = layerIdx === 0 ? '#b8860b' : (layerIdx === 1 ? '#d35400' : '#e1b12c');
    c2 = '#7e5a00';
  } else { // Night
    c1 = layerIdx === 0 ? '#0f241d' : (layerIdx === 1 ? '#153229' : '#1d4236');
    c2 = '#07110e';
  }
  
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  
  ctx.fillStyle = grad;
  ctx.fill();
}

function drawGrassBlades(ctx, width, height) {
  grassBlades.forEach(blade => {
    const bx = blade.xPct * width;
    const by = getHillHeightAt(blade.xPct, blade.layer);
    
    // Wind factor sway calculation
    const windEffect = windForce * (4 - blade.layer) * 1.5; // Closer is stiffer, back is looser
    const naturalSway = Math.sin(animationTime * blade.swaySpeed * 10 + blade.phaseOffset) * blade.swayRange;
    const finalBend = naturalSway + windEffect;
    
    // Draw blade paths
    ctx.beginPath();
    ctx.moveTo(bx, by);
    
    // Curve coordinates
    const midX = bx + finalBend * blade.height * 0.4;
    const midY = by - blade.height * 0.5;
    const topX = bx + finalBend * blade.height;
    const topY = by - blade.height;
    
    ctx.quadraticCurveTo(midX, midY, topX, topY);
    ctx.quadraticCurveTo(midX + blade.width * 0.7, midY, bx + blade.width, by);
    ctx.closePath();
    
    // Blend shading color based on layer depth
    let grassH, grassS, grassL;
    if (activeWeather === 'morning') {
      grassH = 135; grassS = 65; grassL = 40 + blade.layer * 8 + blade.colorOffset;
    } else if (activeWeather === 'sunny') {
      grassH = 145; grassS = 75; grassL = 42 + blade.layer * 9 + blade.colorOffset;
    } else if (activeWeather === 'sunset') {
      grassH = 38; grassS = 80; grassL = 34 + blade.layer * 8 + blade.colorOffset;
    } else { // night
      grassH = 160; grassS = 50; grassL = 12 + blade.layer * 5 + blade.colorOffset;
    }
    
    ctx.fillStyle = `hsl(${grassH}, ${grassS}%, ${grassL}%)`;
    ctx.fill();
  });
}

function drawFlowers(ctx) {
  const width = window.innerWidth;
  
  gardenFlowers.forEach(flower => {
    // Smoothly scale up flowers to their growth target
    const targetScale = 0.4 + (flower.growth * 0.2);
    flower.scale += (targetScale - flower.scale) * 0.08;
    
    ctx.save();
    ctx.translate(flower.x, flower.y);
    ctx.scale(flower.scale, flower.scale);
    
    // Wind bend factor
    const flowerWindBend = windForce * 22;
    
    // 1. Draw Green Stem with leaves
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(flowerWindBend * 0.5, -25, flowerWindBend, -50);
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    
    // Leaf left
    ctx.beginPath();
    ctx.ellipse(flowerWindBend * 0.2 - 6, -15, 7, 3, Math.PI/6, 0, Math.PI*2);
    ctx.fillStyle = '#27ae60';
    ctx.fill();
    
    // Leaf right
    ctx.beginPath();
    ctx.ellipse(flowerWindBend * 0.4 + 6, -30, 7, 3, -Math.PI/6, 0, Math.PI*2);
    ctx.fillStyle = '#27ae60';
    ctx.fill();
    
    // Translate origin to top of stem to draw bud
    ctx.translate(flowerWindBend, -50);
    
    // 2. Draw flower head based on seed type and growth progress
    if (flower.growth === 0) {
      // Seed mound (Dirt soil)
      ctx.beginPath();
      ctx.arc(0, 50, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#8d5b4c';
      ctx.fill();
    } else if (flower.growth === 1) {
      // Sprout (Small green leaf bundle)
      ctx.beginPath();
      ctx.ellipse(-3, 0, 4, 8, -Math.PI/12, 0, Math.PI*2);
      ctx.ellipse(3, 0, 4, 8, Math.PI/12, 0, Math.PI*2);
      ctx.fillStyle = '#78e08f';
      ctx.fill();
    } else if (flower.growth === 2) {
      // Bud (Closed petals)
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      
      let budColor = '#ff7675';
      if (flower.type === 'daisy') budColor = '#feca57';
      if (flower.type === 'lavender') budColor = '#bdc581';
      if (flower.type === 'clover') budColor = '#27ae60';
      
      ctx.fillStyle = budColor;
      ctx.fill();
    } else {
      // 3. Fully bloomed vectors
      const t = flower.type;
      
      if (t === 'tulip') {
        // Red/pink cup-shape Tulip
        ctx.beginPath();
        ctx.moveTo(-9, 4);
        ctx.quadraticCurveTo(-14, -14, -5, -20);
        ctx.quadraticCurveTo(0, -10, 0, 4);
        ctx.quadraticCurveTo(0, -10, 5, -20);
        ctx.quadraticCurveTo(14, -14, 9, 4);
        ctx.closePath();
        ctx.fillStyle = '#ff7675';
        ctx.fill();
        // Inner petal accent
        ctx.beginPath();
        ctx.moveTo(-4, -4);
        ctx.lineTo(0, -16);
        ctx.lineTo(4, -4);
        ctx.closePath();
        ctx.fillStyle = '#ff4d4d';
        ctx.fill();
      } 
      else if (t === 'daisy') {
        // Yellow daisy petals
        ctx.fillStyle = '#ffffff';
        for (let j = 0; j < 8; j++) {
          ctx.rotate(Math.PI / 4);
          ctx.beginPath();
          ctx.ellipse(0, -9, 4, 9, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        // Center disc
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#feca57';
        ctx.fill();
      } 
      else if (t === 'lavender') {
        // Purple stacked oval bells
        ctx.fillStyle = '#a55eea';
        ctx.beginPath();
        ctx.ellipse(0, 4, 5, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(0, -4, 4, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(-3, -10, 4, 3, Math.PI/4, 0, Math.PI * 2);
        ctx.ellipse(3, -10, 4, 3, -Math.PI/4, 0, Math.PI * 2);
        ctx.ellipse(0, -16, 3, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      } 
      else if (t === 'clover') {
        // Four heart-shaped green leaves
        ctx.fillStyle = '#2ed573';
        for (let j = 0; j < 4; j++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-9, -9, -9, 3, 0, 0);
          ctx.bezierCurveTo(9, -9, 9, 3, 0, 0);
          ctx.fill();
        }
      }
    }
    
    ctx.restore();
  });
}

function updateAndDrawParticles(ctx) {
  // 1. Wind Petals
  for (let i = petalParticles.length - 1; i >= 0; i--) {
    const p = petalParticles[i];
    
    p.x += p.vx + windForce * 6;
    p.y += p.vy + 0.8; // gradual gravity fall
    p.rotation += p.rotSpeed;
    
    // Wave flutter oscillation
    p.x += Math.sin(animationTime * 4 + p.y * 0.05) * 0.8;
    
    // Render petal
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    
    // Draw leaf petal
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-p.size * 0.5, -p.size, p.size, -p.size);
    ctx.quadraticCurveTo(p.size * 0.5, p.size * 0.5, 0, 0);
    ctx.fill();
    
    ctx.restore();
    
    // Fade out out of bounds
    if (p.x > window.innerWidth || p.y > window.innerHeight - 50) {
      p.alpha -= 0.015;
    }
    
    if (p.alpha <= 0) {
      petalParticles.splice(i, 1);
    }
  }
  
  // 2. Watering Drops
  for (let i = rainWaterParticles.length - 1; i >= 0; i--) {
    const w = rainWaterParticles[i];
    w.y += w.vy;
    w.x += w.vx + windForce * 0.8;
    
    ctx.beginPath();
    ctx.moveTo(w.x, w.y);
    ctx.lineTo(w.x + windForce * 2, w.y + 6);
    ctx.strokeStyle = `rgba(116, 185, 255, ${w.alpha})`;
    ctx.lineWidth = w.size;
    ctx.stroke();
    
    if (w.y >= w.targetY) {
      // Hit target, create tiny splash, and fade
      w.alpha -= 0.15;
    }
    if (w.alpha <= 0 || w.y > window.innerHeight) {
      rainWaterParticles.splice(i, 1);
    }
  }
  
  // 3. Dirt Particles
  for (let i = dirtParticles.length - 1; i >= 0; i--) {
    const d = dirtParticles[i];
    d.x += d.vx;
    d.vy += d.gravity;
    d.y += d.vy;
    d.alpha -= 0.025;
    
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
    ctx.fillStyle = d.color;
    ctx.globalAlpha = Math.max(0, d.alpha);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    if (d.alpha <= 0) {
      dirtParticles.splice(i, 1);
    }
  }
  
  // 4. Magical Sparkles
  for (let i = magicalSparkles.length - 1; i >= 0; i--) {
    const s = magicalSparkles[i];
    s.x += s.vx;
    s.y += s.vy;
    s.alpha -= s.fadeRate;
    
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.fillStyle = s.color;
    ctx.globalAlpha = Math.max(0, s.alpha);
    
    // Draw star diamond
    ctx.beginPath();
    ctx.moveTo(0, -s.size);
    ctx.lineTo(s.size * 0.6, 0);
    ctx.lineTo(0, s.size);
    ctx.lineTo(-s.size * 0.6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    if (s.alpha <= 0) {
      magicalSparkles.splice(i, 1);
    }
  }
  
  // Natural Ambient Petal rain (only during morning/sunny/sunset)
  if (activeWeather !== 'night' && Math.random() < 0.015 && petalParticles.length < 25) {
    petalParticles.push({
      x: -50 + Math.random() * (window.innerWidth * 0.8),
      y: -20,
      vx: 1 + Math.random() * 1.5,
      vy: 0.5 + Math.random() * 0.8,
      size: 5 + Math.random() * 5,
      rotation: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      alpha: 0.75,
      color: Math.random() > 0.5 ? '#ffb8d1' : (Math.random() > 0.65 ? '#fecfef' : '#ff7675')
    });
  }
}

function updateAndDrawFireflies(ctx) {
  const isNight = activeWeather === 'sunset' || activeWeather === 'night';
  
  ambientFireflies.forEach(fire => {
    // Smoothly shift target alpha depending on night weather modes
    fire.alpha += (fire.targetAlpha - fire.alpha) * 0.02;
    
    if (fire.alpha <= 0.01) return; // Skip rendering when invisible
    
    // Random noise orbit float
    fire.angleX += fire.speedX;
    fire.angleY += fire.speedY;
    
    const fx = fire.x + Math.sin(fire.angleX) * fire.rangeX + windForce * 12;
    const fy = fire.y + Math.cos(fire.angleY) * fire.rangeY;
    
    // Blink twinkle effect
    const blink = 0.4 + Math.abs(Math.sin(fire.angleX * 1.5)) * 0.6;
    
    ctx.beginPath();
    ctx.arc(fx, fy, fire.radius, 0, Math.PI * 2);
    
    // Glow radial gradient shadow
    const radG = ctx.createRadialGradient(fx, fy, 0, fx, fy, fire.radius * 3.5);
    radG.addColorStop(0, `rgba(245, 205, 121, ${fire.alpha * blink})`);
    radG.addColorStop(1, `rgba(245, 205, 121, 0)`);
    
    ctx.fillStyle = radG;
    ctx.fill();
  });
}
