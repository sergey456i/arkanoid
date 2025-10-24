let name = '';
let game = {};
let panel = 'start';
let $ = function (domElement) {
    return document.querySelector(domElement);
}

let nav = () => {
    document.onclick = (e) => {
        e.preventDefault();
        switch (e.target.id) {
            case 'startGame':
                go('game', 'd-flex');
                break;
            case 'restart':
                go('game', 'd-flex');
                for (let child of $('.elements').querySelectorAll('.element'))
                    child.remove();
                break;
        }
    }
}

let go = (page, attribute) => {
    let pages = ['start', 'game', 'end'];
    panel = page;
    $(`#${page}`).setAttribute('class', attribute);
    pages.forEach(el => {
        if(el !== page) $(`#${el}`).setAttribute('class', 'd-none');
    })
}

let checkStorage = () => {
    $('#nameInput').value = localStorage.getItem('userName') || '';
}

let checkName = () => {
    name = $('#nameInput').value.trim();
    if(name !== '') {
        localStorage.setItem('userName', name);
        $('#startGame').removeAttribute('disabled');
    } else {
        $('#startGame').setAttribute('disabled', '');
    }
}

let startLoop = () => {
    let inter = setInterval(() => {
        checkName();
        if(panel !== 'start') clearInterval(inter);
    }, 100)
}

window.onload = () => {
    checkStorage();
    nav();
    startLoop();
    setInterval(() => {
        if(panel === 'game') {
            game = new Game();
            game.start();
            panel = 'game process';
        }
    }, 500)
}

let random = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}