const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// --- Sound Effects ---
const explosionSound = new Audio("sounds/explosion.mp3");
const shootingStarSound = new Audio("sounds/shootingstar.mp3");

function playSound(sound, volume = 1) {
  const clone = sound.cloneNode();
  clone.volume = volume;
  clone.playbackRate = 0.9 + Math.random() * 0.2;
  clone.play();
}

// --- Background Stars ---
let stars = [];
function generateStars() {
  stars = [];
  const numStars = 150;
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5,
      alpha: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.01
    });
  }
}
generateStars();

function drawStars() {
  stars.forEach(star => {
    star.alpha += star.twinkleSpeed * (Math.random() > 0.5 ? 1 : -1);
    star.alpha = Math.max(0, Math.min(1, star.alpha));

    ctx.save();
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// --- Shooting Stars with corrected trails ---
let shootingStars = [];
function spawnShootingStar() {
  if (Math.random() < 0.01) { // ~1% chance per frame
    shootingStars.push({
      x: Math.random() * canvas.width,
      y: -20,
      speedX: Math.random() * 1 - 0.5,
      speedY: Math.random() * 4 + 4,
      radius: Math.random() * 1.2 + 0.8,
      length: Math.random() * 60 + 40,
      alpha: 1
    });
    playSound(shootingStarSound, 0.2);
  }
}

function drawShootingStars() {
  shootingStars.forEach((s, i) => {
    ctx.save();
    ctx.globalAlpha = s.alpha;

    // Head glow
    const headGradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius * 3);
    headGradient.addColorStop(0, "rgb(255, 255, 255)");
    headGradient.addColorStop(0.5, "rgb(255, 187, 0)");
    headGradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius * 3, 0, Math.PI * 2);
    ctx.fill();

    // Trail behind the star (reverse direction)
    const trailX = s.x - s.speedX * s.length;
    const trailY = s.y - s.speedY * s.length;

    const trailGradient = ctx.createLinearGradient(s.x, s.y, trailX, trailY);
    trailGradient.addColorStop(0, "hsla(44, 100%, 91%, 0.80)");
    trailGradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.strokeStyle = trailGradient;

    // Thin near head
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.speedX * (s.length * 0.5), s.y - s.speedY * (s.length * 0.5));
    ctx.stroke();

    // Wider near tail
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(s.x - s.speedX * (s.length * 0.5), s.y - s.speedY * (s.length * 0.5));
    ctx.lineTo(trailX, trailY);
    ctx.stroke();

    ctx.restore();

    // Update position
    s.x += s.speedX;
    s.y += s.speedY;
    s.alpha -= 0.01;

    if (s.alpha <= 0 || s.y > canvas.height + 50) {
      shootingStars.splice(i, 1);
    }
  });
}

// --- Fireworks Particles ---
class Particle {
  constructor(x, y, color, speed, angle, glow = 20) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 3 + 1;

    this.speedX = Math.cos(angle) * speed;
    this.speedY = Math.sin(angle) * speed;

    this.alpha = 1;
    this.decay = Math.random() * 0.02 + 0.01;
    this.glow = glow;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.speedY += 0.05; // gravity
    this.speedX *= 0.98;
    this.speedY *= 0.98;
    this.alpha -= this.decay;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    const size = this.radius * (2 - this.alpha);

    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.5, this.color);
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = gradient;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.glow;

    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

let particles = [];

// --- Firework Creation ---
function createFirework(x, y) {
  const colors = ["red","yellow","blue","green","purple","orange","cyan","magenta","lime","gold"];
  const fireworkColor = colors[Math.floor(Math.random() * colors.length)];

  const rand = Math.random();
  let numParticles = 200;

  if (rand < 0.25) {
    const rings = 3;
    numParticles = 100;
    for (let r = 1; r <= rings; r++) {
      const ringSpeed = r * 3;
      for (let i = 0; i < numParticles; i++) {
        const angle = (i / numParticles) * Math.PI * 2;
        particles.push(new Particle(x, y, fireworkColor, ringSpeed, angle));
      }
    }
  } else if (rand < 0.5) {
    const points = 5;
    numParticles = 100;
    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 2 * points / 5;
      const speed = Math.random() * 7 + 2;
      particles.push(new Particle(x, y, fireworkColor, speed, angle));
    }
  } else if (rand < 0.6) {
    numParticles = 300;
    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 4;
      particles.push(new Particle(x, y, fireworkColor, speed, angle, 40));
    }
  } else {
    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8;
      particles.push(new Particle(x, y, fireworkColor, speed, angle));
    }
  }

  playSound(explosionSound, 0.4);

  const MAX_PARTICLES = 2000;
  if (particles.length > MAX_PARTICLES) {
    particles.splice(0, particles.length - MAX_PARTICLES);
  }
}

// --- Animation Loop ---
function animate() {
  const bgGradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
  bgGradient.addColorStop(0, "#000000");
  bgGradient.addColorStop(1, "#2e004f");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStars();
  spawnShootingStar();
  drawShootingStars();

  particles.forEach(p => {
    p.update();
    p.draw();
  });

  particles = particles.filter(p => p.alpha > 0);

  requestAnimationFrame(animate);
}
animate();

// --- Controls ---
canvas.addEventListener("click", (e) => {
  createFirework(e.clientX, e.clientY);
});

let autoMode = false;
let autoInterval;

document.getElementById("auto").addEventListener("click", () => {
  autoMode = !autoMode;
  if (autoMode) {
    autoInterval = setInterval(() => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.7;
      createFirework(x, y);
    }, 800);
  } else {
    clearInterval(autoInterval);
  }
});

document.getElementById("clear").addEventListener("click", () => {
  particles = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  generateStars(); // regenerate stars after clearing
});
