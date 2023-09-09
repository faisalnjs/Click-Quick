socket.on('connect', () => {
    console.log('Connected to server');
    socket.volatile.emit('join room', roomId);
    document.querySelectorAll(".yourId").forEach(yourId => {
        yourId.innerText = socket.id;
    });
});

socket.on('new room', (type, id) => {
    console.log(`New ${type} room created with ID ${id}`);
    roomType = type;
    roomId = id;
    updateRoom();
});

socket.on('update players', (updatedPlayers) => {
    console.log('Player list updated', updatedPlayers);
    players = updatedPlayers;
    renderPlayers();
});

function handleCreateRoom() {
    socket.volatile.emit('create room', 'friends');
    setTimeout(function () {
        location.href = `/${roomId}`;
    }, 5000);
};

function handleJoinPublicRoom() {
    socket.volatile.emit('join room', 'public');
};

function handleJoinPrivateRoom() {
    location.href = `/${roomCode}`;
};

function handleInputChange() {
    roomCode = document.getElementById('roomCode').value;
};

function renderPlayers() {
    var playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    players.forEach((player) => {
        var li = document.createElement('li');
        li.innerText = player.firstname || 'Guest';
        if (player.id === socket.id) {
            li.innerText += ' (you)';
        };
        li.innerText += ` (${player.points} tokens)`;
        playersList.appendChild(li);
    });
};

function updateRoom() {
    document.querySelectorAll('.roomId').forEach(roomId => {
        roomId.innerText = roomId;
    });
    document.querySelectorAll('.roomType').forEach(roomType => {
        roomType.innerText = roomType;
    });
};

Array.prototype.next = function () {
    return this[++this.current];
};
Array.prototype.prev = function () {
    return this[--this.current];
};
Array.prototype.current = -1;

document.querySelectorAll('.main .container button')[4].style.display = "none";
document.querySelectorAll('.main .container button')[5].style.display = "none";

function startGame() {
    t = setInterval(changeColor, 500);
    running = true;
    socket.volatile.emit('rpoint');
    function changeColor() {
        if (colors.next()) {
            newColor = colors[colors.current];
        } else {
            newColor = colors[0];
            colors.current = 0;
        };
        document.querySelector('.main .container .game').style.cursor = `url('cursor-${newColor.color}.cur'), auto`;
    };
    document.querySelectorAll('.main .container .game .inner .box').forEach((box, key) => {
        if (key === 0) {
            have = 0;
        };
        box.addEventListener('click', function () {
            if (running) {
                if (this.style.backgroundColor === '') {
                    this.style.backgroundColor = newColor.rgb;
                    have++;
                    if (have === wanted) {
                        clearInterval(t);
                    };
                };
            };
        });
    });
    document.querySelectorAll('.main .container button')[3].style.display = "none";
    document.querySelectorAll('.main .container button')[4].style.display = "";
    document.querySelectorAll('.main .container button')[5].style.display = "";
};

function stopGame() {
    clearInterval(t);
    running = false;
    acquiredTokens = 0;
    colors.forEach(color => {
        ofColor = [];
        document.querySelectorAll('.main .container .game .inner .box').forEach((box, key) => {
            if (box.style.backgroundColor === color.rgb) {
                ofColor.push(key + 1);
            };
        });
        if (ofColor.includes(1) && ofColor.includes(2) && ofColor.includes(3) && ofColor.includes(4)) {
            acquiredTokens++;
        };
        if (ofColor.includes(5) && ofColor.includes(6) && ofColor.includes(7) && ofColor.includes(8)) {
            acquiredTokens++;
        };
        if (ofColor.includes(9) && ofColor.includes(10) && ofColor.includes(11) && ofColor.includes(12)) {
            acquiredTokens++;
        };
        if (ofColor.includes(13) && ofColor.includes(14) && ofColor.includes(15) && ofColor.includes(16)) {
            acquiredTokens++;
        };
        if (ofColor.includes(1) && ofColor.includes(5) && ofColor.includes(9) && ofColor.includes(13)) {
            acquiredTokens++;
        };
        if (ofColor.includes(2) && ofColor.includes(6) && ofColor.includes(10) && ofColor.includes(14)) {
            acquiredTokens++;
        };
        if (ofColor.includes(3) && ofColor.includes(7) && ofColor.includes(11) && ofColor.includes(15)) {
            acquiredTokens++;
        };
        if (ofColor.includes(4) && ofColor.includes(8) && ofColor.includes(12) && ofColor.includes(16)) {
            acquiredTokens++;
        };
    });
    socket.volatile.emit('point', acquiredTokens);
    alert(`You got ${acquiredTokens} tokens!`);
    document.querySelectorAll('.main .container button')[3].style.display = "none";
    document.querySelectorAll('.main .container button')[4].style.display = "none";
};

function clearGame() {
    document.querySelectorAll('.main .container .game .inner .box').forEach((box) => {
        box.style.backgroundColor = '';
    });
    have = 0;
    document.querySelectorAll('.main .container button')[3].style.display = "";
    document.querySelectorAll('.main .container button')[4].style.display = "";
    document.querySelectorAll('.main .container button')[5].style.display = "none";
};

function toggleTokens() {
    alert("Coming soon!");
};