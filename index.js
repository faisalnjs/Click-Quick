const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const shortid = require('shortid');

app.set('view engine', 'ejs');

var rooms = { public: [] };
var roomId = 'public';
var roomType = 'public';

app.get('/:roomId', (req, res) => {
  if (req.params.roomId) {
    if (rooms[req.params.roomId]) {
      res.render('index', { roomId: req.params.roomId, roomType: 'friends', roomCode, rooms, players: rooms[roomId] || [], socket: io, error: null });
    } else {
      res.render('index', { roomId, roomType, roomCode, rooms, players: rooms.public || [], socket: io, error: "Room does not exist" });
    };
  } else {
    res.render('index', { roomId, roomType, roomCode, rooms, players: rooms.public || [], socket: io, error: null });
  };
});

io.on('connection', (socket) => {
  console.log('Connected to server!');

  socket.on('create room', () => {
    roomId = shortid.generate();
    roomType = 'friends';
    socket.emit('new room', roomType, roomId);
    rooms[roomId] = [socket.id];
    io.to(roomId).emit('update players', rooms[roomId] || []);
  });

  socket.on('new player', (type, id) => {
    if (type === 'public') {
      if (!rooms.public) {
        rooms.public = [];
      }
      if (!rooms.public.includes(socket.id)) {
        rooms.public.push(socket.id);
      };
    } else if (type === 'friends') {
      if (!id) {
        roomId = shortid.generate();
        socket.emit('new room', type, roomId);
        rooms[roomId] = [];
      };
      if (!rooms[roomId].includes(socket.id)) {
        rooms[roomId].push(socket.id);
      };
    };

    socket.join(roomId);
    console.log(rooms);
    io.to(roomId).emit('update players', rooms[roomId] || []);
  });

  socket.on('disconnect', () => {
    if (rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter((player) => player !== socket.id);
      io.to(roomId).emit('update players', rooms[roomId] || []);
    }
  });

  socket.on('join private room', (code) => {
    if (rooms[code]) {
      if (!rooms[code].includes(socket.id)) {
        rooms[code].push(socket.id);
      };
      socket.join(code);
      io.to(roomId).emit('update players', rooms[roomId] || []);
    };
  });
});

http.listen(3000, () => {
  console.log('Server is listening on port 3000');
});