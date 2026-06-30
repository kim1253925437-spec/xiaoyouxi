const GameState = {
  START: "start",
  INTRO: "intro",
  ANIMAL_STAGE: "animal_stage",
  EGG_STAGE: "egg_stage",
  ROUND_COMPLETE: "round_complete"
};

const animals = [
  { id: "chicken", nameCn: "小鸡", nameEn: "chicken", emoji: "🐥", color: "#ffd665", call: "chirp" },
  { id: "duck", nameCn: "小鸭", nameEn: "duck", emoji: "🦆", color: "#7edbff", call: "quack" },
  { id: "goose", nameCn: "小鹅", nameEn: "goose", emoji: "🪿", color: "#fff2b0", call: "honk" },
  { id: "bird", nameCn: "小鸟", nameEn: "bird", emoji: "🐦", color: "#8ed8ff", call: "tweet" },
  { id: "cat", nameCn: "小猫", nameEn: "cat", emoji: "🐱", color: "#ffc18a", call: "meow" },
  { id: "dog", nameCn: "小狗", nameEn: "dog", emoji: "🐶", color: "#d7b48a", call: "woof" },
  { id: "sheep", nameCn: "小羊", nameEn: "sheep", emoji: "🐑", color: "#f6f1df", call: "baa" },
  { id: "cow", nameCn: "小牛", nameEn: "cow", emoji: "🐮", color: "#f2f2f2", call: "moo" },
  { id: "pig", nameCn: "小猪", nameEn: "pig", emoji: "🐷", color: "#ffabc3", call: "oink" },
  { id: "rabbit", nameCn: "小兔", nameEn: "rabbit", emoji: "🐰", color: "#f8f4ff", call: "hop" }
];

const playfield = document.querySelector("#playfield");
const homePanel = document.querySelector("#homePanel");
const startButton = document.querySelector("#startButton");
const topbar = document.querySelector("#topbar");
const roundLabel = document.querySelector("#roundLabel");
const stageTitle = document.querySelector("#stageTitle");
const counterLabel = document.querySelector("#counterLabel");
const counterValue = document.querySelector("#counterValue");
const toast = document.querySelector("#toast");

const state = {
  gameState: GameState.START,
  round: 1,
  animalDone: 0,
  eggDone: 0,
  eggs: [],
  busy: false,
  audioContext: null
};

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function unlockAudio() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!state.audioContext) state.audioContext = new AudioCtor();
  if (state.audioContext.state === "suspended") state.audioContext.resume();
  return state.audioContext;
}

function playToneSequence(steps, wave = "sine", volume = 0.18) {
  const ctx = unlockAudio();
  if (!ctx) return Promise.resolve();

  const startAt = ctx.currentTime + 0.02;
  let cursor = startAt;

  steps.forEach(([freq, duration, gainScale = 1]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, cursor);
    filter.type = "lowpass";
    filter.frequency.value = Math.max(freq * 3.2, 800);
    gain.gain.setValueAtTime(0.0001, cursor);
    gain.gain.exponentialRampToValueAtTime(volume * gainScale, cursor + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, cursor + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(cursor);
    osc.stop(cursor + duration + 0.03);
    cursor += duration + 0.045;
  });

  return wait(Math.max(140, (cursor - startAt) * 1000));
}

function playAnimalCall(animal) {
  const patterns = {
    chirp: [[780, .11], [1050, .1], [860, .12]],
    quack: [[330, .18], [280, .16]],
    honk: [[220, .22], [185, .24]],
    tweet: [[920, .08], [1240, .08], [1000, .1]],
    meow: [[520, .16], [440, .18], [620, .16]],
    woof: [[190, .14], [155, .16]],
    baa: [[330, .22], [300, .24], [350, .18]],
    moo: [[150, .32], [120, .36]],
    oink: [[260, .12], [310, .12], [230, .18]],
    hop: [[620, .09], [820, .08], [520, .1]]
  };
  const waves = {
    chirp: "triangle",
    tweet: "triangle",
    meow: "sawtooth",
    woof: "square",
    moo: "sine",
    oink: "square"
  };
  return playToneSequence(patterns[animal.call], waves[animal.call] || "sine", 0.16);
}

function playEffect(type) {
  const effects = {
    click: [[620, .05], [760, .04]],
    drop: [[520, .06], [260, .11]],
    crack: [[180, .06], [420, .05], [260, .08]],
    success: [[520, .1], [660, .1], [880, .16]]
  };
  return playToneSequence(effects[type], "triangle", type === "success" ? 0.2 : 0.13);
}

function speak(text, lang = "zh-CN", fallbackMs = 900) {
  if (!("speechSynthesis" in window)) return wait(fallbackMs);

  return new Promise(resolve => {
    const utterance = new SpeechSynthesisUtterance(text);
    let done = false;
    utterance.lang = lang;
    utterance.rate = lang === "en-US" ? 0.76 : 0.9;
    utterance.pitch = lang === "en-US" ? 1.12 : 1.05;

    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    window.setTimeout(finish, fallbackMs + 700);
  });
}

function setStage(title, label, value) {
  stageTitle.textContent = title;
  counterLabel.textContent = label;
  counterValue.textContent = value;
  roundLabel.textContent = `第 ${state.round} 轮`;
}

function buildPositions(count) {
  const positions = [];
  let guard = 0;

  while (positions.length < count && guard < 600) {
    guard += 1;
    const x = randomBetween(10, 90);
    const y = randomBetween(20, 78);
    const farEnough = positions.every(pos => {
      const dx = pos.x - x;
      const dy = pos.y - y;
      return Math.hypot(dx, dy) > 18;
    });
    if (farEnough) positions.push({ x, y });
  }

  while (positions.length < count) {
    const col = positions.length % 5;
    const row = Math.floor(positions.length / 5);
    positions.push({ x: 14 + col * 18, y: 30 + row * 32 });
  }

  return positions;
}

function createAnimalNode(animal, position) {
  const button = document.createElement("button");
  button.className = "animal";
  button.type = "button";
  button.style.left = `${position.x}%`;
  button.style.top = `${position.y}%`;
  button.style.background = `radial-gradient(circle at 35% 28%, rgba(255,255,255,.9) 0 9%, transparent 10%), linear-gradient(180deg, #fffdf0, ${animal.color})`;
  button.setAttribute("aria-label", `${animal.nameCn} ${animal.nameEn}`);
  button.innerHTML = `
    <span class="emoji" aria-hidden="true">${animal.emoji}</span>
    <span class="label">${animal.nameCn}</span>
  `;
  button.addEventListener("pointerdown", () => handleAnimalClick(button, animal, position), { passive: true });
  return button;
}

function createEggNode(position) {
  const egg = document.createElement("button");
  egg.className = "egg drop";
  egg.type = "button";
  egg.style.left = `${position.x}%`;
  egg.style.top = `${Math.min(position.y + 13, 88)}%`;
  egg.setAttribute("aria-label", "点击鸡蛋破壳");
  egg.dataset.locked = "false";
  egg.addEventListener("pointerdown", () => handleEggClick(egg), { passive: true });
  playfield.appendChild(egg);
  state.eggs.push(egg);
  playEffect("drop");
  return egg;
}

async function handleAnimalClick(node, animal, position) {
  if (state.gameState !== GameState.ANIMAL_STAGE || state.busy || node.classList.contains("locked")) return;

  state.busy = true;
  node.classList.add("locked", "laying");
  await playEffect("click");
  await playAnimalCall(animal);
  await speak(animal.nameEn, "en-US", 650);
  createEggNode(position);
  await wait(360);
  node.classList.add("vanish");
  await wait(430);
  node.remove();
  state.animalDone += 1;
  setStage("点点小动物", "动物", `${state.animalDone}/10`);

  if (state.animalDone >= animals.length) {
    await wait(520);
    startEggStage();
  } else {
    state.busy = false;
  }
}

async function handleEggClick(egg) {
  if (state.gameState !== GameState.EGG_STAGE || state.busy || egg.dataset.locked === "true") return;

  state.busy = true;
  egg.dataset.locked = "true";
  egg.classList.add("cracking");
  await playEffect("click");
  await wait(420);
  await playEffect("crack");
  egg.classList.remove("cracking");
  egg.classList.add("open");

  const animal = animals[Math.floor(Math.random() * animals.length)];
  const born = document.createElement("div");
  born.className = "hatched-animal";
  born.style.left = egg.style.left;
  born.style.top = egg.style.top;
  born.innerHTML = `<span class="emoji" aria-hidden="true">${animal.emoji}</span>`;
  playfield.appendChild(born);
  await playAnimalCall(animal);

  state.eggDone += 1;
  setStage("点点鸡蛋", "鸡蛋", `${state.eggDone}/10`);
  await wait(260);

  if (state.eggDone >= animals.length) {
    completeRound();
  } else {
    state.busy = false;
  }
}

function startAnimalStage() {
  state.gameState = GameState.ANIMAL_STAGE;
  state.animalDone = 0;
  state.eggDone = 0;
  state.eggs = [];
  state.busy = false;
  playfield.innerHTML = "";
  toast.hidden = true;
  setStage("点点小动物", "动物", "0/10");

  const positions = buildPositions(animals.length);
  shuffle(animals).forEach((animal, index) => {
    playfield.appendChild(createAnimalNode(animal, positions[index]));
  });
}

function startEggStage() {
  state.gameState = GameState.EGG_STAGE;
  state.busy = false;
  setStage("点点鸡蛋", "鸡蛋", "0/10");
}

async function completeRound() {
  state.gameState = GameState.ROUND_COMPLETE;
  await playEffect("success");
  toast.hidden = false;
  await speak("太棒啦！再来一次！", "zh-CN", 1200);
  await wait(900);
  state.round += 1;
  startAnimalStage();
}

async function startGame() {
  if (state.gameState !== GameState.START) return;
  unlockAudio();
  state.gameState = GameState.INTRO;
  homePanel.hidden = true;
  topbar.hidden = false;
  setStage("准备开始", "动物", "0/10");
  await playEffect("click");
  await speak("小朋友准备好了吗？三，二，一，开始！", "zh-CN", 2200);
  startAnimalStage();
}

startButton.addEventListener("pointerdown", startGame, { passive: true });

window.addEventListener("orientationchange", () => {
  window.setTimeout(() => window.scrollTo(0, 0), 250);
});

document.addEventListener("gesturestart", event => event.preventDefault());
