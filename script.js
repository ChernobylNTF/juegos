window.addEventListener('load', () => {
    console.log("Página cargada. Iniciando carga de imágenes...");
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) { /*...*/ return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { /*...*/ return; }

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    console.log("Canvas redimensionado a:", canvas.width, "x", canvas.height);

    // --- PRECARGA DE IMÁGENES ---
    const imagePaths = {
        player: 'imagenes/player.png',
        enemy: 'imagenes/enemy_1.png',
        background: 'imagenes/espacio.png',
        supply_life: 'imagenes/HP_Bonus.png' // <<-- AÑADIDO SUMINISTRO VIDA
    };
    let sprites = {};
    let imagesToLoad = Object.keys(imagePaths).length;
    let imagesLoaded = 0;

    function onImageLoad() { /* ... (código igual) ... */ imagesLoaded++; console.log(`Imagen cargada (${imagesLoaded}/${imagesToLoad})`); if (imagesLoaded === imagesToLoad) { console.log("¡Todas las imágenes cargadas! Iniciando juego..."); startGameLogic(); } }
    function loadImage(key, path) { /* ... (código igual) ... */ console.log("Cargando imagen:", path); const img = new Image(); img.onload = onImageLoad; img.onerror = () => { console.error("Error al cargar imagen:", path); onImageLoad(); }; img.src = path; sprites[key] = img; }
    for (const key in imagePaths) { loadImage(key, imagePaths[key]); }


    // --- LÓGICA DEL JUEGO ---
    function startGameLogic() {

        let score = 0;
        let playerLives = 3;
        const maxLives = 5; // <<-- Límite máximo de vidas
        let isGameOver = false;
        const playerInitialX = canvas.width / 2 - 15;
        const playerInitialY = canvas.height - 40;
        const player = { width: 50, height: 50, x: playerInitialX, y: playerInitialY, speed: 4 };
        const bulletProps = { width: 5, height: 10, color: 'yellow', speed: 10 };
        let bullets = [];
        const enemyProps = { width: 45, height: 45, speed: 2 };
        let enemies = [];
        let enemySpawnIntervalId = null;

        // --- NUEVO: Suministros ---
        const supplyProps = {
            width: 20,
            height: 20,
            speed: 1.5, // Más lento que los enemigos
            spawnChance: 0.001 // Probabilidad baja de aparecer en cada frame
        };
        let supplies = []; // Array para guardar suministros activos

        // --- Control Táctil ---
        let isTouching = false;
        let touchX = player.x + player.width / 2;
        let touchY = player.y + player.height / 2;
        function getTouchPos(canvasDom, touchEvent) { /* ... (código igual) ... */ const rect = canvasDom.getBoundingClientRect(); const clientX = touchEvent.touches[0].clientX; const clientY = touchEvent.touches[0].clientY; const canvasX = clientX - rect.left; const canvasY = clientY - rect.top; return { x: canvasX, y: canvasY }; }
        canvas.addEventListener('touchstart', (e) => { /* ... (código igual) ... */ e.preventDefault(); if (isGameOver) { restartGame(); return; } if (e.touches.length > 0) { isTouching = true; const pos = getTouchPos(canvas, e); touchX = pos.x; touchY = pos.y; } }, { passive: false });
        canvas.addEventListener('touchmove', (e) => { /* ... (código igual) ... */ e.preventDefault(); if (!isGameOver && isTouching && e.touches.length > 0) { const pos = getTouchPos(canvas, e); touchX = pos.x; touchY = pos.y; } }, { passive: false });
        canvas.addEventListener('touchend', (e) => { /* ... (código igual) ... */ e.preventDefault(); if (isTouching) { isTouching = false; if (!isGameOver) fireBullet(); console.log("Touch End - ¡Disparo!"); } });
        canvas.addEventListener('touchcancel', (e) => { isTouching = false; console.log("Touch Cancel"); });

        // --- Funciones ---
        function drawPlayer() { /* ... (código igual) ... */ if (sprites.player && sprites.player.complete) { ctx.drawImage(sprites.player, player.x, player.y, player.width, player.height); } else { ctx.fillStyle = 'deepskyblue'; ctx.fillRect(player.x, player.y, player.width, player.height); } }
        function updatePlayerPosition() { /* ... (código igual) ... */ if (isGameOver) return; if (isTouching) { const targetX = touchX - player.width / 2; const targetY = touchY - player.height / 2; const dx = targetX - player.x; const dy = targetY - player.y; const distance = Math.sqrt(dx * dx + dy * dy); if (distance > 1) { const moveX = (dx / distance) * player.speed; const moveY = (dy / distance) * player.speed; if (distance < player.speed) { player.x = targetX; player.y = targetY; } else { player.x += moveX; player.y += moveY; } } } if (player.x < 0) player.x = 0; if (player.x + player.width > canvas.width) player.x = canvas.width - player.width; if (player.y < 0) player.y = 0; if (player.y + player.height > canvas.height) player.y = canvas.height - player.height; }
        function fireBullet() { /* ... (código igual) ... */ const newBullet = { x: player.x + player.width / 2 - bulletProps.width / 2, y: player.y, width: bulletProps.width, height: bulletProps.height, color: bulletProps.color, speed: bulletProps.speed }; bullets.push(newBullet); try { const shootSound = new Audio('sounds/disparo.mp3'); shootSound.volume = 0.5; shootSound.play(); } catch (error) { console.error("Error al reproducir sonido:", error); } }
        function updateBullets() { /* ... (código igual) ... */ if (isGameOver) return; for (let i = bullets.length - 1; i >= 0; i--) { const bullet = bullets[i]; bullet.y -= bullet.speed; if (bullet.y + bullet.height < 0) { bullets.splice(i, 1); } } }
        function drawBullets() { /* ... (código igual) ... */ for (let i = 0; i < bullets.length; i++) { const bullet = bullets[i]; ctx.fillStyle = bullet.color; ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height); } }
        function spawnEnemy() { /* ... (código igual) ... */ if (isGameOver) return; const randomX = Math.random() * (canvas.width - enemyProps.width); const newEnemy = { x: randomX, y: 0 - enemyProps.height, width: enemyProps.width, height: enemyProps.height, speed: enemyProps.speed }; enemies.push(newEnemy); }
        function updateEnemies() { /* ... (código igual) ... */ if (isGameOver) return; for (let i = enemies.length - 1; i >= 0; i--) { const enemy = enemies[i]; enemy.y += enemy.speed; if (enemy.y > canvas.height) { enemies.splice(i, 1); } } }
        function drawEnemies() { /* ... (código igual) ... */ if (sprites.enemy && sprites.enemy.complete) { for (let i = 0; i < enemies.length; i++) { const enemy = enemies[i]; ctx.drawImage(sprites.enemy, enemy.x, enemy.y, enemy.width, enemy.height); } } else { ctx.fillStyle = 'red'; for (let i = 0; i < enemies.length; i++) { const enemy = enemies[i]; ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height); } } }
        function drawUI() { /* ... (código igual) ... */ ctx.fillStyle = 'white'; ctx.font = '20px Arial'; ctx.textAlign = 'left'; ctx.fillText(`Puntuación: ${score}`, 10, 25); ctx.fillText(`Vidas: ${playerLives}`, canvas.width - 90, 25); }

        // --- NUEVAS FUNCIONES PARA SUMINISTROS ---

        // Crea un suministro de vida si la suerte acompaña
        function trySpawnSupply() {
             if (Math.random() < supplyProps.spawnChance) { // Baja probabilidad en cada frame
                const randomX = Math.random() * (canvas.width - supplyProps.width);
                const newSupply = {
                    x: randomX,
                    y: 0 - supplyProps.height,
                    width: supplyProps.width,
                    height: supplyProps.height,
                    speed: supplyProps.speed,
                    type: 'life' // Identificador del tipo de suministro
                };
                supplies.push(newSupply);
                console.log("Suministro de vida creado!");
            }
        }

        // Actualiza la posición de los suministros
        function updateSupplies() {
            if (isGameOver) return;
            for (let i = supplies.length - 1; i >= 0; i--) {
                const supply = supplies[i];
                supply.y += supply.speed; // Mover hacia abajo

                // Eliminar si sale por abajo
                if (supply.y > canvas.height) {
                    supplies.splice(i, 1);
                }
            }
        }

        // Dibuja los suministros
        function drawSupplies() {
            if (sprites.supply_life && sprites.supply_life.complete) { // Verifica si la imagen está lista
                 for (let i = 0; i < supplies.length; i++) {
                    const supply = supplies[i];
                    if (supply.type === 'life') {
                         ctx.drawImage(sprites.supply_life, supply.x, supply.y, supply.width, supply.height);
                    }
                    // Aquí podríamos añadir 'else if' para otros tipos de suministros con otras imágenes
                }
            } else {
                // Dibujo de respaldo si la imagen falla
                 ctx.fillStyle = 'lime'; // Verde lima como respaldo para vida extra
                 for (let i = 0; i < supplies.length; i++) {
                    const supply = supplies[i];
                    if (supply.type === 'life') {
                        ctx.fillRect(supply.x, supply.y, supply.width, supply.height);
                    }
                 }
            }
        }
        // -------------------------------------------


        // MODIFICADA: Función de Colisiones
function checkCollisions() {
    if (isGameOver) return; 

    // 1. Balas vs Enemigos
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i]; 
        if (!bullet) continue; // Seguridad

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j]; 
            if (!enemy) continue; // Seguridad

            // AABB Check (Bullet vs Enemy)
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {

                console.log("¡COLISIÓN Bala-Enemigo!"); 
                score += 10;
                console.log("Puntuación:", score);
                bullets.splice(i, 1); 
                enemies.splice(j, 1); 
                break; 
            }
        }
    }

    // 2. Jugador vs Enemigos
    for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j]; 
        if (!enemy || !player) continue; // Seguridad

        // AABB Check (Player vs Enemy)
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {

            console.log("¡COLISIÓN Jugador-Enemigo!");
            enemies.splice(j, 1); 
            playerLives--; 
            console.log("Vidas restantes:", playerLives);

            if (playerLives <= 0) { 
                console.log("GAME OVER");
                isGameOver = true; 
                clearInterval(enemySpawnIntervalId); 
            }
            break; 
        }
    }

    // 3. Jugador vs Suministros (Esta parte SÍ te funciona)
    for (let k = supplies.length - 1; k >= 0; k--) {
        const supply = supplies[k]; 
        if (!supply || !player) continue; // Seguridad

        // AABB Check (Player vs Supply)
        if (player.x < supply.x + supply.width &&
            player.x + player.width > supply.x &&
            player.y < supply.y + supply.height &&
            player.y + player.height > supply.y) {

            console.log("¡Suministro Recogido!", supply.type);
            if (supply.type === 'life') {
                if (playerLives < maxLives) { 
                    playerLives++;
                    console.log("Vida extra! Vidas:", playerLives);
                } else {
                    console.log("Vidas al máximo!");
                    score += 25; 
                    console.log("Puntuación:", score);
                }
            }
            supplies.splice(k, 1); 
        }
    }
}

        function drawGameOver() { /* ... (código igual) ... */ if (isGameOver) { ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'white'; ctx.font = '40px Arial'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40); ctx.font = '20px Arial'; ctx.fillText(`Puntuación Final: ${score}`, canvas.width / 2, canvas.height / 2); ctx.font = '16px Arial'; ctx.fillText('Toca la pantalla para reiniciar', canvas.width / 2, canvas.height / 2 + 40); } }
        
        // --- NUEVO: Estrellas para el fondo animado ---
const starProps = {
    count: 100, // Número de estrellas
    speed: 2,  // Velocidad de caída (lenta)
    color: 'white',
    size: 1.5    // Tamaño de cada estrella (píxeles)
};
let stars = [];

// ***** FUNCIÓN QUE FALTABA *****
// Función para crear las estrellas iniciales
function createStars() {
    console.log(">>> INTENTANDO Crear estrellas..."); // <--- AÑADE ESTA LÍNEA
    stars = [];
    for (let i = 0; i < starProps.count; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * starProps.size + 0.5
        });
    }
    console.log(">>> " + stars.length + " estrellas creadas."); // <-- Ya estaba
}

// Función para mover las estrellas
function updateStars() {
    if (isGameOver) return;
    console.log(">>> Actualizando estrellas..."); // <--- AÑADE ESTA LÍNEA
    for (let i = 0; i < stars.length; i++) {
        stars[i].y += starProps.speed;
        if (stars[i].y > canvas.height) {
            stars[i].y = 0 - stars[i].size;
            stars[i].x = Math.random() * canvas.width;
        }
    }
}

// Función para dibujar las estrellas
function drawStars() {
    console.log(">>> Dibujando estrellas..."); // <--- AÑADE ESTA LÍNEA
    ctx.fillStyle = starProps.color;
    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
}
// ---------------------------------------------

// ... (resto de tus funciones: getTouchPos, drawPlayer, fireBullet, etc...) ...

function restartGame() {
    console.log("Reiniciando juego...");
    score = 0; playerLives = 3; isGameOver = false;
    bullets = []; enemies = []; supplies = [];
    player.x = playerInitialX; player.y = playerInitialY;
    // ¡ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ AQUÍ DENTRO!
    createStars(); // <<-- Llama a la función para (re)crear las estrellas
    clearInterval(enemySpawnIntervalId);
    enemySpawnIntervalId = setInterval(spawnEnemy, 2000);
    gameLoop(); // Llama a gameLoop para empezar/reiniciar
}

// ... (función gameLoop, etc.) ...

        function restartGame() {
            console.log("Reiniciando juego...");
            score = 0; playerLives = 3; isGameOver = false;
            bullets = []; enemies = []; supplies = []; // <<-- Limpia suministros también
            player.x = playerInitialX; player.y = playerInitialY;
            createStars();
            clearInterval(enemySpawnIntervalId);
            enemySpawnIntervalId = setInterval(spawnEnemy, 2000);
            gameLoop();
        }

        // --- Game Loop ---
        function gameLoop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // 1. Limpiar

            // 2. Dibujar Fondo y Estrellas
            if (sprites.background && sprites.background.complete) { ctx.drawImage(sprites.background, 0, 0, canvas.width, canvas.height); } else { ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
            if (!isGameOver) updateStars();
            drawStars();

            // 3. Intentar crear suministro (solo si no es Game Over)
            if (!isGameOver) trySpawnSupply(); // <<-- Intenta crear suministros

            // 4. Actualizar Estado
            updatePlayerPosition(); updateBullets(); updateEnemies(); updateSupplies(); // <<-- Actualiza suministros
            checkCollisions(); // Ya incluye colisión con suministros

            // 5. Dibujar Elementos
            drawPlayer(); drawBullets(); drawEnemies(); drawSupplies(); // <<-- Dibuja suministros
            drawUI();

            // 6. Dibujar Game Over
            drawGameOver();

            // 7. Siguiente frame
            if (!isGameOver) { requestAnimationFrame(gameLoop); }
            else { console.log("Game loop detenido. Esperando reinicio..."); }
        }

        // Iniciar el Juego
        console.log("Función startGameLogic ejecutada.");
        restartGame(); // Llama a restart para la configuración inicial

    } // Fin de startGameLogic

}); // Fin del addEventListener 'load'
