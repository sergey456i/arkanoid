class Drawable {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.offsets = {
            x: 0,
            y: 0
        }
    }

    update() {
        this.x += this.offsets.x;
        this.y += this.offsets.y;
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.className = "element " + this.constructor.name.toLowerCase();
        $('.elements').append(this.element);
    }

    draw() {
        this.element.style =`
            left: ${this.x}px;
        top: ${this.y}px;
        width: ${this.w}px;
        height: ${this.h}px;
        `;
    }

    removeElement() {
        this.element.remove();
    }

    isCollision(element) {
        let a = {
            x1: this.x,
            y1: this.y,
            x2: this.x + this.w,
            y2: this.y + this.h
        };
        let b = {
            x1: element.x,
            y1: element.y,
            x2: element.x + element.w,
            y2: element.y + element.h
        }
        return a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
    }
}

class Block extends Drawable {
    constructor(game, x, y, color) {
        super(game);
        this.w = 80;
        this.h = 30;
        this.x = x;
        this.y = y;
        this.createElement();
        this.element.classList.add(color);
    }

    update() {
        if(this.isCollision(this.game.ball)) {
            this.game.ball.offsets.y *= -1;
            this.game.remove(this);
            this.removeElement();
            this.game.points++;
        }
    }
}

class Ball extends Drawable {
    constructor(game) {
        super(game);
        this.w = 20;
        this.h = 20;
        this.x = window.innerWidth / 2 - this.w / 2;
        this.y = window.innerHeight - 150;
        this.offsets.x = random(-5, 5);
        this.offsets.y = -5;
        this.createElement();
    }

    update() {
        // Отскок от стен
        if(this.x <= 312 || this.x >= window.innerWidth - this.w) {
            this.offsets.x *= -1;
        }

        // Отскок от потолка
        if(this.y <= 0) {
            this.offsets.y *= -1;
        }

        // Проверка столкновения с платформой
        if(this.isCollision(this.game.player)) {
            // Меняем направление в зависимости от места удара о платформу
            let hitPos = (this.x + this.w/2) - (this.game.player.x + this.game.player.w/2);
            this.offsets.x = hitPos * 0.1;
            this.offsets.y *= -1;
        }

        // Проверка падения мяча
        if(this.y > window.innerHeight) {
            if (!this.game.isTestMode) {
                // В обычном режиме - уменьшаем жизни и сбрасываем мяч
                this.game.hp--;
                this.reset();
            } else {
                this.y = window.innerHeight - this.h;
                this.offsets.y *= -1;
            }
        } else {
            super.update();
        }
    }

    reset() {
        this.x = window.innerWidth / 2 - this.w / 2;
        this.y = window.innerHeight - 150;
        this.offsets.x = random(-5, 5);
        this.offsets.y = -5;
    }
}

class Player extends Drawable {
    constructor(game) {
        super(game);
        this.w = 150;
        this.h = 20;
        this.x = window.innerWidth / 1.57 - this.w ;
        this.y = window.innerHeight - 50;
        this.speedPerFrame = 10;
        this.skillTimer = 0;
        this.couldTimer = 0;
        this.leftBoundary = 312;
        this.keys ={
            ArrowLeft: false,
            ArrowRight: false,
            Space: false
        }
        this.createElement();
        this.bindKeyEvents();
    }

    bindKeyEvents() {
        document.addEventListener('keydown', ev => this.changeKeyStatus(ev.code, true))
        document.addEventListener('keyup', ev => this.changeKeyStatus(ev.code, false))
    }

    changeKeyStatus(code, value) {
        if(code in this.keys) this.keys[code] = value;
    }
    update() {
        if (this.keys.ArrowLeft) {
            this.offsets.x = -this.speedPerFrame;
        } else if (this.keys.ArrowRight) {
            this.offsets.x = this.speedPerFrame;
        } else {
            this.offsets.x = 0;
        }

        super.update();
        const maxRight = window.innerWidth - this.w;
        this.x = Math.max(this.leftBoundary, Math.min(this.x, maxRight));

        if(this.keys.Space && this.couldTimer === 0){
            this.skillTimer++;
            $('#skill').innerHTML = `Осталось ${Math.ceil((240 - this.skillTimer) / 60)}`;
            this.applySkill();
        }

        if(this.skillTimer > 240 || (!this.keys.Space && this.skillTimer > 1)){
            this.couldTimer++;
            $('#skill').innerHTML = `Осталось ${Math.ceil((300 - this.couldTimer) / 60)}`;
            this.keys.Space = false;
        }

        if(this.couldTimer > 300){
            this.couldTimer = 0;
            this.skillTimer = 0;
            $('#skill').innerHTML = 'Готово';
        }

        super.update();
    }

    applySkill() {
        // Ускорение мяча при использовании навыка
        this.game.ball.offsets.x *= 1.01;
        this.game.ball.offsets.y *= 1.01;
    }
}

class Game {
    constructor(name) { // Принимаем имя в конструкторе
        this.name = name;
        this.isTestMode = (name === 'tester'); // Определяем режим теста
        this.elements = [];
        this.player = this.generate(Player);
        this.ball = this.generate(Ball);
        this.counterForTimer = 0;
        this.blockColors = ['red', 'blue', 'green', 'yellow'];

        // Начальное количество жизней зависит от режима
        this.hp = this.isTestMode ? 999 : 3; // Много жизней в тесте

        this.points = 0;
        this.time = {
            m1: 0,
            m2: 0,
            s1: 0,
            s2: 0
        };
        this.ended = false;
        this.pause = false;
        this.keyEvents();
        this.createBlocks();
    }

    start() {
        this.loop();
    }

    generate(className) {
        let element = new className(this);
        this.elements.push(element);
        return element;
    }

    createBlocks() {
        const rows = 8;
        const cols = 8;
        const blockWidth = 80;
        const blockHeight = 30;
        const margin = 10;
        const startX = (window.innerWidth - (cols * (blockWidth + margin))) / 1.5; // Исправлено деление

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * (blockWidth + margin);
                const y = 10 + row * (blockHeight + margin);
                const color = this.blockColors[row % this.blockColors.length];
                this.generateBlock(x, y, color);
            }
        }
    }

    generateBlock(x, y, color) {
        let block = new Block(this, x, y, color);
        this.elements.push(block);
        return block;
    }

    keyEvents() {
        addEventListener('keydown', ev => {
            if(ev.code === "Escape") this.pause = !this.pause;
        })
    }

    loop() {
        requestAnimationFrame(() => {
            if(!this.pause) {
                // В тестовом режиме таймер не увеличивается
                if (!this.isTestMode) {
                    this.counterForTimer++;
                    if (this.counterForTimer % 60 === 0) {
                        this.timer();
                    }
                }

                // В тестовом режиме игра не заканчивается по условиям hp/points
                if (!this.isTestMode && (this.hp < 0 || this.points >= 64)) {
                    this.end();
                } else if (this.points >= 64) { // Но если набраны все блоки, можно завершить
                    this.end();
                }

                $('.pause').style.display = 'none';
                this.updateElements();
                this.setParams();
            } else if(this.pause) {
                $('.pause').style.display = 'flex';
            }
            if(!this.ended) this.loop();
        });
    }

    updateElements() {
        this.elements.forEach(element => {
            element.update();
            element.draw();
        })
    }

    setParams() {
        let params = ['name', 'points', 'hp'];
        let values = [this.name, this.points, this.hp];
        params.forEach((param, ind) => {
            $(`#${param}`).innerHTML = values[ind];
        });
    }

    remove(el) {
        let idx = this.elements.indexOf(el);
        if(idx !== -1){
            this.elements.splice(idx, 1);
            return true;
        }
        return false;
    }

    timer() {
        let time = this.time;
        time.s2++;
        if(time.s2 >= 10){
            time.s2 = 0;
            time.s1++;
        }
        if(time.s1 >= 6){
            time.s1 = 0;
            time.m2++;
        }
        if(time.m2 >= 10){
            time.m2 = 0;
            time.m1++;
        }
        $('#timer').innerHTML = `${time.m1}${time.m2}:${time.s1}${time.s2}`;
    }

    end() {
        this.ended = true;
        let time = this.time;
        if(this.points >= 64) {
            $('#playerName').innerHTML = `Поздравляем, ${this.name}!`;
            $('#endTime').innerHTML = `Ваше время, ${time.m1}${time.m2}:${time.s1}${time.s2}`;
            $('#collectedFruits').innerHTML = `Вы разбили ${this.points} блоков`;
            $('#congratulation').innerHTML = `Вы выиграли!`;
        } else {
            $('#playerName').innerHTML = `Жаль, ${this.name}!`;
            $('#endTime').innerHTML = `Ваше время, ${time.m1}${time.m2}:${time.s1}${time.s2}`;
            $('#collectedFruits').innerHTML = `Вы разбили ${this.points} блоков`;
            $('#congratulation').innerHTML = `Вы проиграли`;
        }
        go('end', 'panel d-flex justify-content-center align-items-center');
    }
}