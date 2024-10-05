const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const modal = document.getElementById('modal');
const resumeButton = document.getElementById('resumeButton');
const volumeSlider = document.getElementById('volumeSlider');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gravity = 0.5;
let player = {
    x: 50,
    y: 50,
    width: 60,
    height: 60,
    velocityY: 0,
    jumpPower: -15,
    canJump: true,
    isJumping: false,
    isDead: false,
    spriteRun: [],
    spriteJump: null,
    spriteDie: null,
    currentSprite: null,
};

let obstacles = [];
let frameCount = 0;
let gameRunning = false;
let paused = false;
let score = 0;
let highScore = 0;
let lastObstacleX = canvas.width;
let obstacleFrequency = 2000; // Frecuencia en milisegundos
let lastObstacleTime = 0;
let obstacleSpeed = 3; // Velocidad inicial de los obstáculos
let speedIncreaseInterval = 10000; // Aumentar la velocidad cada 10 segundos
let speedIncrement = 0.1; // Incremento suave de velocidad
let frequencyDecreaseScore = 10; // Puntuación después de la cual se reduce la frecuencia
let lastSpeedIncrease = Date.now(); // Tiempo de la última actualización de velocidad


// Variables de sonido
const jumpSound = new Audio('https://www.dropbox.com/scl/fi/hgw8z7ys2e5exf23plomw/264828__cmdrobot__text-message-or-videogame-jump.ogg?rlkey=fql0laomv47wgknq9v5tx9759&st=5gibsil7&dl=1'); // URL de sonido de salto
const backgroundMusic = new Audio('https://www.dropbox.com/scl/fi/f24svwh0ahyad8aslrbf5/415804__sunsai__mushroom-background-music.wav?rlkey=5nyg0ujl15s1cp2d6abim8zpq&st=tecxy3io&dl=1'); // URL de música de fondo
const deathSound = new Audio('https://www.dropbox.com/scl/fi/ke6c8348dme1tt8455gge/geo.mp3?rlkey=js5h0nwrdthx8w2m49p2cvga2&st=2ni022m6&dl=1'); // URL de sonido de muerte

// Ajustar volumen inicial
backgroundMusic.loop = true; // Para que la música de fondo se repita
backgroundMusic.volume = 0.3; // Volumen ajustado
// Cargar los sprites

const spriteRun1 = new Image();
spriteRun1.src = 'https://www.dropbox.com/scl/fi/5yx1rns1ckbtgorr21coh/image1.png?rlkey=8i4gye9qhykq8vty6hi5qapfv&dl=1';
const spriteRun2 = new Image();
spriteRun2.src = 'https://www.dropbox.com/scl/fi/b11exe8bw78d2fauflm0a/image2.png?rlkey=nytcy99ododdev7ugu858wjsd&dl=1';
const spriteJump = new Image();
spriteJump.src = 'https://www.dropbox.com/scl/fi/wps2asv7lfgokxcogjm46/image5.png?rlkey=s69vto87olwwq9biwwlz59i54&dl=1';
const spriteDie = new Image();
spriteDie.src = 'https://www.dropbox.com/scl/fi/e4n59byjrhz2fbpsdmpbj/image4.png?rlkey=dvbhu8i7faqpyzwwyvtb617pm&dl=1';
const spriteObstacle = new Image(); // Nuevo sprite para los obstáculos
spriteObstacle.src = 'https://www.dropbox.com/scl/fi/rvh2rxgosg8sdqihd0mt6/IMG_20241005_024119.png?rlkey=dpa9y2l2kvtauhd3m63whfivn&st=kizmb9bw&dl=1';
// Fondos
const backgroundImages = [
    'https://www.dropbox.com/scl/fi/m8hwjf899n9td7mbk2fm6/1728118685527.png?rlkey=j2y4rbd05jsj5z5e0nht5ypyr&st=df6ghrs5&dl=1', // Mapa 1
    'https://img.freepik.com/foto-gratis/papel-pintado-grafico-2d-gradientes-granulados-coloridos_23-2151001503.jpg'  // Mapa 2 (puedes cambiar la URL por otro fondo si lo deseas)
];

let currentBackground = new Image();
currentBackground.src = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];

player.spriteRun.push(spriteRun1, spriteRun2);
player.spriteJump = spriteJump;
player.spriteDie = spriteDie;
player.currentSprite = player.spriteRun[0];


function resetGame() {
    // Detener sonidos anteriores
    backgroundMusic.pause();
    deathSound.pause();
    jumpSound.pause();

    player.x = 50;
    player.y = 50;
    player.velocityY = 0;
    player.canJump = true;
    player.isJumping = false;
    player.isDead = false;
    obstacles = []; // Reiniciar obstáculos
    frameCount = 0;
    score = 0;
    gameRunning = true;
    startButton.classList.add('hidden');
    lastObstacleX = canvas.width; // Reiniciar posición de obstáculos
    lastObstacleTime = 0; // Reiniciar tiempo de obstáculos
    obstacleSpeed = 3; // Reiniciar velocidad
    obstacleFrequency = 2000; // Reiniciar frecuencia
    lastSpeedIncrease = Date.now(); // Reiniciar el contador de velocidad

    // Seleccionar un nuevo fondo al reiniciar el juego
    currentBackground.src = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];

    // Reproducir la música de fondo
    backgroundMusic.currentTime = 0; // Reiniciar el tiempo de la música
    backgroundMusic.play(); // Iniciar la música de fondo
}
function createObstacle() {
    const height = 50; // Ajusta la altura del obstáculo
    const width = 50; // Ajusta el ancho del obstáculo
    obstacles.push({
        x: lastObstacleX,
        y: canvas.height - height - 10, // Ajustar para que se coloque sobre la plataforma
        width: width,
        height: height,
        passed: false,
        image: spriteObstacle // Añadir el sprite del obstáculo
    });
    lastObstacleX += width + 200; // Espacio entre obstáculos
}

function updatePlayer() {
    player.velocityY += gravity;
    player.y += player.velocityY;

    // Evitar que el jugador caiga por debajo de la plataforma
    if (player.y + player.height >= canvas.height - 10) {
        player.y = canvas.height - 10 - player.height; // Ajustar para que no sobrepase la plataforma
        player.velocityY = 2;
        player.canJump = true;
        player.isJumping = false;
    } else {
        player.isJumping = true;
    }

    // Cambiar el sprite en función del estado del jugador
    if (player.isDead) {
        // Solo cambiar al sprite de morir si no está brincando
        if (!player.isJumping) {
            player.currentSprite = player.spriteDie;
        }
        return; // No continuar con el resto de la función si está muerto
    }

    if (player.isJumping) {
        player.currentSprite = player.spriteJump;
    } else {
        player.currentSprite = player.spriteRun[Math.floor(frameCount / 10) % player.spriteRun.length];
    }
}


function handleObstacles() {
    const currentTime = Date.now();
    if (currentTime - lastObstacleTime > obstacleFrequency) {
        createObstacle();
        lastObstacleTime = currentTime;
    }

    if (currentTime - lastSpeedIncrease > speedIncreaseInterval) {
        obstacleSpeed += speedIncrement;
        lastSpeedIncrease = currentTime;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= obstacleSpeed;
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score++;
        }
        
        if (
            player.x < obstacles[i].x + obstacles[i].width &&
            player.x + player.width > obstacles[i].x &&
            player.y + player.height > obstacles[i].y &&
            player.y < obstacles[i].y + obstacles[i].height
        ) {
            gameRunning = false;
            player.isDead = true;
            player.canJump = false;
            
            if (score > highScore) {
                highScore = score;
            }
            
            startButton.classList.remove('hidden');

            // Reproducir sonido de muerte y detener la música de fondo
            backgroundMusic.pause(); // Detener la música de fondo
            deathSound.play(); // Reproducir sonido de muerte
        }
    }

    if (score >= frequencyDecreaseScore) {
        obstacleFrequency = Math.max(500, obstacleFrequency - 50);
        frequencyDecreaseScore += 10;
    }
}


function drawBackground() {
    ctx.drawImage(currentBackground, 0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
    if (player.currentSprite) {
        ctx.drawImage(player.currentSprite, player.x, player.y, player.width, player.height);
    }
}

function drawObstacles() {
    for (let obstacle of obstacles) {
        ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height); // Dibujar el obstáculo como imagen
    }
}

function drawPlatform() {
    ctx.fillStyle = 'green'; // Color sólido para la plataforma
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
}

function drawScore()  {
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Puntuación: ${score}`, 10, 30);
    ctx.fillText(`Máxima Puntuación: ${highScore}`, 10, 60);
}
function gameLoop() {
    if (!gameRunning || paused) {
        drawPlayer();
        drawObstacles(); // Dibujar obstáculos incluso si el juego está en pausa
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(); // Dibujar el fondo
    drawPlatform();
    drawPlayer();
    handleObstacles();
    drawObstacles();
    updatePlayer();
    drawScore();
    frameCount++;
    requestAnimationFrame(gameLoop);
}

function jump() {
    if (player.canJump) {
        player.velocityY = player.jumpPower;
        player.canJump = false;
        player.isJumping = true;
        jumpSound.play(); // Reproducir sonido de salto
    }
}

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
});

startButton.addEventListener('click', () => {
    resetGame();
    gameLoop();
});

pauseButton.addEventListener('click', () => {
    paused = !paused;
    modal.style.display = paused ? 'flex' : 'none';
});

resumeButton.addEventListener('click', () => {
    paused = false;
    modal.style.display = 'none';
    gameLoop();
});


volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value;
    backgroundMusic.volume = volume;
    jumpSound.volume = volume;
    deathSound.volume = volume;
    console.log(`Volumen ajustado a: ${volume}`);
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    platformHeight = canvas.height - 10;
});

