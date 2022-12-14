const socket = io();
console.log('hello');

const statElem = document.getElementById('status');
const playerElem = document.getElementById('player');
const roomNumElem = document.getElementById('roomName');
let currStat = '';
let currPlayer = '';

//Only fetch rooms if not in a game
function updateRoomList() {
  if (currStat === '') {
    socket.emit('roomList');
  }
}

//Poll for a room update every 5 seconds
updateRoomList();
setInterval(updateRoomList, 5000);

//Change the status field whenever a status update occurs
function statusUpdate(stat) {
  currStat = stat;
  if (stat === 'notStarted') {
    statElem.innerHTML = `Waiting for a second player...`;
    statElem.className = '';
    statElem.classList.add('notStarted');
  } else if (stat === 'red') {
    statElem.innerHTML = `It's the Red player's turn.`;
    statElem.className = '';
    statElem.classList.add('redTurn');
  } else if (stat === 'black') {
    statElem.innerHTML = `It's the Black player's turn.`;
    statElem.className = '';
    statElem.classList.add('blackTurn');
  } else if (stat === 'redWin') {
    statElem.innerHTML = `The Red player wins!`;
    statElem.className = '';
    statElem.classList.add('redWin');
    socket.disconnect();
  } else if (stat === 'blackWin') {
    statElem.innerHTML = `The Black player wins!`;
    statElem.className = '';
    statElem.classList.add('blackWin');
    socket.disconnect();
  } else if (stat === 'disconnect') {
    statElem.innerHTML = `The other player has disconnected... (Forfeit)`;
    statElem.className = '';
    statElem.classList.add('disconnect');
    socket.disconnect();
  } else if (stat === 'draw') {
    statElem.innerHTML = `The game ended in a draw!`;
    statElem.className = '';
    statElem.classList.add('draw');
    socket.disconnect();
  }
}

//On join, server sends the client their player info and the name of the room
socket.on('assignPlayer', (player, roomName) => {
  currPlayer = player;
  if (player === 'red') {
    playerElem.innerHTML = `You are playing as Red.`;
    playerElem.classList.remove('redplayer', 'blackplayer');
    playerElem.classList.add('redplayer');
  } else if (player === 'black') {
    playerElem.innerHTML = `You are playing as Black.`;
    playerElem.classList.remove('redplayer', 'blackplayer');
    playerElem.classList.add('blackplayer');
  }

  roomNumElem.innerHTML = roomName;
});

//Populate room list in HTML when received
socket.on('roomList', (list) => {
  let roomSelector = document.getElementById('roomlist');
  roomSelector.innerHTML = '';
  for (const i of list) {
    let item = document.createElement('li');
    item.innerHTML = i + `<button onclick="joinRoom('${i}')">Join</button>`;
    roomSelector.appendChild(item);
  }
});

function joinRoom(roomName) {
  socket.emit('joinRoom', roomName);
}

function createRoom() {
  socket.emit('createRoom');
}

//Alerts usually won't show up as the client attempts to prevent sending invalid events
socket.on('serverMessage', (message) => {
  alert(message);
});

//Receive a new board state from the server and display it on the screen
//The first time a board state is received, removes the roomlist screen and shows the board
socket.on('gameUpdate', (board, stat) => {
  if (currStat === '') {
    let indexWindow = document.getElementById('index');
    let gameWindow = document.getElementById('gamescreen');
    indexWindow.classList.add('hide');
    gameWindow.classList.remove('hide');
  }

  //populate board tiles
  let rowNum = 1;
  for (const row of board) {
    let colNum = 1;
    for (const col of row) {
      let space = document.getElementById(
        String(rowNum) + 'x' + String(colNum)
      );
      space.classList.remove('red', 'black');

      if (col === 'black') {
        space.classList.add('black');
      } else if (col === 'red') {
        space.classList.add('red');
      }
      colNum += 1;
    }
    rowNum += 1;
  }

  statusUpdate(stat);
});

function sendMove(column) {
  console.log('placing piece at ' + String(column));
  socket.emit('move', column);
}

//listeners for clicking buttons and hovering over elements
//A yellow arrow shows what column of the board you're about to select
let spaces = document.querySelectorAll('td');
spaces.forEach(function (elem) {
  elem.addEventListener('mouseover', function () {
    if (currStat == currPlayer) {
      let headers = document.querySelectorAll('th');
      headers.forEach(function (header) {
        header.classList.remove('hovered');
      });
      let arrow = document.getElementById('col' + elem.id[2]);
      arrow.classList.add('hovered');
    }
  });

  elem.addEventListener('mouseout', function () {
    let arrow = document.getElementById('col' + elem.id[2]);
    arrow.classList.remove('hovered');
  });

  elem.addEventListener('click', function () {
    if (currStat == currPlayer) {
      sendMove(elem.id[2]);
      let arrow = document.getElementById('col' + elem.id[2]);
      arrow.classList.remove('hovered');
    }
  });
});

let create_room_button = document.getElementById('create_room');
create_room_button.addEventListener('click', function () {
  createRoom();
  console.log('room create');
});
