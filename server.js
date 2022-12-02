require('./config/env.js');

const app = require('express')();
var expsess = require('express-session');
const port = process.env.PORT || 5000;
const http = require('http').Server(app);
const io = require('socket.io')(http);

let session = expsess({
  secret: 'wowee',
  cookie: {},
});

//game

function sendGameUpdate(game, room) {
  io.to(room).emit('gameUpdate', game.board, game.status);
}

function updateBoard(column, roomName, player) {
  //fail cases
  if (rooms[roomName].board[0][column] != 0) return 'invalidMove';
  if (rooms[roomName].status != player) return 'notTurn';

  //find first row from bottom in selected column with a free space
  for (let row = rooms[roomName].board.length - 1; row >= 0; row -= 1) {
    //if empty, place piece there
    if (rooms[roomName].board[row][column] === 0) {
      rooms[roomName].board[row][column] = player;
      //change turn to opposite player
      if (player === 'red') rooms[roomName].status = 'black';
      else if (player === 'black') rooms[roomName].status = 'red';
      //if a player won, change board status
      if (checkWin(player, roomName) === true)
        rooms[roomName].status = player + 'Win';
      //if there are no empty spaces left, change board status
      if (checkDraw(roomName) === true) rooms[roomName].status = 'draw';
      return 'success';
    }
  }
}

function checkWin(player, roomName) {
  let game = rooms[roomName];
  //check for a vertical win
  for (let row = 3; row < game.board.length; row += 1) {
    for (let col = 0; col < game.board[0].length; col += 1) {
      if (
        game.board[row][col] === player &&
        game.board[row - 1][col] === player &&
        game.board[row - 2][col] === player &&
        game.board[row - 3][col] === player
      ) {
        return true;
      }
    }
  }

  //check for a horizontal win
  for (let row = 0; row < game.board.length; row += 1) {
    for (let col = 3; col < game.board[0].length; col += 1) {
      if (
        game.board[row][col] === player &&
        game.board[row][col - 1] === player &&
        game.board[row][col - 2] === player &&
        game.board[row][col - 3] === player
      ) {
        return true;
      }
    }
  }

  //check for diagonal win #1
  for (let row = 3; row < game.board.length; row += 1) {
    for (let col = 3; col < game.board[0].length; col += 1) {
      if (
        game.board[row][col] === player &&
        game.board[row - 1][col - 1] === player &&
        game.board[row - 2][col - 2] === player &&
        game.board[row - 3][col - 3] === player
      ) {
        return true;
      }
    }
  }

  //check for diagonal win #2
  for (let row = 3; row < game.board.length; row += 1) {
    for (let col = 0; col < game.board[0].length - 3; col += 1) {
      if (
        game.board[row][col] === player &&
        game.board[row - 1][col + 1] === player &&
        game.board[row - 2][col + 2] === player &&
        game.board[row - 3][col + 3] === player
      ) {
        return true;
      }
    }
  }

  return false;
}

function checkDraw(roomName) {
  let game = rooms[roomName];
  for (let col = 0; col < game.board[0].length; col += 1) {
    if (game.board[0][col] === 0) {
      return false;
    }
  }
  return true;
}

let roomNum = 1;
rooms = {};

//socket

io.on('connection', (socket) => {
  let thisroom = '';
  let player = '';

  socket.on('move', (column) => {
    let newBoard = updateBoard(column - 1, thisroom, player);
    if (newBoard === 'invalidMove') {
      socket.emit('serverMessage', `That column is full.`);
    } else if (newBoard === 'notTurn') {
      console.log(player);
      console.log(rooms[thisroom].status);
      socket.emit('serverMessage', `It's not your turn.`);
    } else {
      //rooms[room] = newBoard;
      sendGameUpdate(rooms[thisroom], thisroom);
      if (
        rooms[thisroom].status === 'redWin' ||
        rooms[thisroom].status === 'blackWin'
      ) {
        delete rooms[thisroom];
      }
    }
  });

  socket.on('joinRoom', (roomID) => {
    if (thisroom != '') {
      socket.emit('serverMessage', `Already in a game`);
    } else if (rooms[roomID].status != 'notStarted') {
      socket.emit('serverMessage', `Room full`);
    } else {
      socket.join(roomID);
      thisroom = roomID;
      rooms[roomID].status = 'red';
      sendGameUpdate(rooms[thisroom], thisroom);
      if (rooms[roomID].initPlayer === 'red') {
        socket.emit('assignPlayer', 'black', thisroom);
        player = 'black';
      } else {
        socket.emit('assignPlayer', 'red', thisroom);
        player = 'red';
      }
    }
  });

  socket.on('createRoom', () => {
    thisroom = 'Room ' + String(roomNum);
    socket.join(thisroom);
    rooms[thisroom] = {
      board: [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
      ],
      status: 'notStarted',
    };
    if (Math.random() >= 0.5) {
      player = 'red';
    } else {
      player = 'black';
    }
    sendGameUpdate(rooms[thisroom], thisroom);
    socket.emit('assignPlayer', player, thisroom);
    rooms[thisroom].initPlayer = player;
    roomNum += 1;
  });

  socket.on('roomList', () => {
    roomList = [];
    for (const i in rooms) {
      if (rooms[i].status === 'notStarted') {
        roomList.push(i);
      }
    }
    socket.emit('roomList', roomList);
  });

  socket.on('disconnecting', () => {
    if (thisroom != '' && rooms[thisroom]) {
      if (rooms[thisroom]) rooms[thisroom].status = 'disconnect';
      sendGameUpdate(rooms[thisroom], thisroom);
      if (rooms[thisroom]) delete rooms[thisroom];
    }
  });
});

setInterval(() => {
  if (Object.keys(rooms).length === 0) {
    roomNum = 1;
  }
}, 10000);

//routes

app.get('/public/:file', (req, res) => {
  res.sendFile(__dirname + '/public/' + req.params['file'], {}, function (err) {
    if (err) {
      console.log('Something went wrong.');
      console.log(err);
      res.status(err.status);
    }
  });
});

app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/game.html');
});

//server

http.listen(port, () => {
  console.log(`Listening at ${port}`);
});
