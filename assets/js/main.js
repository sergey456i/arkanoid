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
                name = $('#nameInput').value.trim();
                if (name) {
                    localStorage.setItem('userName', name);
                    setPanel('game', 'd-flex');
                }
                break;
            case 'restart':
                name = $('#nameInput').value.trim() || localStorage.getItem('userName') || 'Player';
                for (let child of $('.elements').querySelectorAll('.element'))
                    child.remove();
                setPanel('game', 'd-flex');
                break;
        }
    }
}
let setPanel = (page, attribute) => {
    let pages = ['start', 'game', 'end'];
    panel = page;
    $(`#${page}`).setAttribute('class', attribute);
    pages.forEach(el => {
        if(el !== page) $(`#${el}`).setAttribute('class', 'd-none');
    });
    if (page === 'game') {
        game = new Game(name);
        game.start();
    }
}
let go = (page, attribute) => {
    setPanel(page, attribute);
};

let checkStorage = () => {
    $('#nameInput').value = localStorage.getItem('userName') || '';
}

let checkName = () => {
    name = $('#nameInput').value.trim();
    if(name !== '') {
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
}

let random = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};