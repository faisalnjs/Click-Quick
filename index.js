const express = require('express');
const session = require("express-session");
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
require('dotenv').config();

app.set('view engine', 'ejs');
app.use(express.static('public'));
const sessionMiddleware = session({
  name: 'sessionid',
  secret: 'FAISALN.CQ',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 86400000 }
});
app.use(sessionMiddleware);
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));

var rooms = { public: [] };
var roomId = 'public';
var roomType = 'public';

function allRoutes(req) {
  if (!req.session.account) {
    if (process.env.NODE_ENV === "production") {
      req.session.account = [];
    } else {
      req.session.account = [];
    };
  };
};

app.get('/', (req, res) => {
  allRoutes(req);
  res.render('index', { roomId: 'public', roomType: 'public', rooms, players: rooms.public || [], socket: io, error: null, session: req.session });
});

app.get("/login", async (req, res) => {
  allRoutes(req);
  if (req.session.loggedIn === true) {
    res.redirect('/')
  } else {
    res.redirect(`https://my.dangoweb.com/?auth=true&redirect=http://${req.hostname}/sso&faisaln=true`)
  }
});

app.get("/sso", async (req, res) => {
  allRoutes(req);
  if (req.query.username) {
    await fetch(`https://api.dangoweb.com/secure/getaccount/${req.query.username}?api-key=${process.env.DANGOAPI_KEY_faisaln}`, {
      method: 'GET',
      headers: {
        Accept: '*/*',
        'User-Agent': 'Dango Portal (https://portal.dangoweb.com)'
      }
    })
      .then(sso => sso.json())
      .then(sso => {
        if (sso.username) {
          console.log(`${sso.username} logged in`)
          req.session.loggedIn = true;
          req.session.account = {
            username: sso.username,
            email: sso.email,
            firstname: sso.firstname,
            lastname: sso.lastname,
            role: sso.role,
            profileimg: sso.profileimg,
            dangos: sso.dangos,
            blocked: sso.blocked
          };
        } else {
          console.log(sso);
          console.log("Failed login");
        };
        res.redirect('/');
      });
  } else {
    res.redirect('/');
  };
});

app.get("/logout", (req, res) => {
  const sessionId = req.session.id;
  req.session.destroy(() => {
    io.in(sessionId).disconnectSockets();
    res.redirect('/');
  });
});

app.get('/:roomId', (req, res) => {
  allRoutes(req);
  console.log(`Attempting to join ${req.params.roomId}`);
  if (req.params.roomId) {
    if (rooms[req.params.roomId]) {
      res.render('index', { roomId: req.params.roomId, roomType: 'friends', rooms, players: rooms[roomId] || [], socket: io, error: null, session: req.session });
    } else {
      console.log(`Room ${req.params.roomId} does not exist`);
      res.render('index', { roomId, roomType, rooms, players: rooms.public || [], socket: io, error: "Room does not exist", session: req.session });
    };
  } else {
    res.redirect('/');
  };
});

io.on('connection', (socket) => {
  userSession = socket.request.session;

  socket.on('create room', () => {
    var IDX = 36, HEX = '';
    while (IDX--) HEX += IDX.toString(36);
    var str = '', num = 6 || 11;
    while (num--) str += HEX[Math.random() * 36 | 0];
    roomId = str;
    roomType = 'friends';
    socket.emit('new room', roomType, roomId);
    userSession.account.id = socket.id;
    rooms[roomId] = [userSession.account];
    io.to(roomId).emit('update players', rooms[roomId] || []);
    socket.join(roomId);
  });

  socket.on('join room', (roomId) => {
    console.log(`New User: ${socket.id} (${userSession.username || 'Guest'}) -> ${roomId}`);
    if (roomId === 'public') {
      if (!userSession.account) {
        userSession.account = [];
      };
      var user = (userSession.account.length === 0) ? { role: 'guest', blocked: 0 } : userSession.account;
      user.id = socket.id;
      userSession.account = user;
      if (!JSON.stringify(rooms[roomId]).includes(socket.id)) {
        rooms.public.push(user);
      };
    } else {
      if (!JSON.stringify(rooms[roomId]).includes(socket.id)) {
        rooms[roomId].push(user);
      };
    };
    socket.join(roomId);
    io.to(roomId).emit('update players', ((roomId === 'public') ? rooms.public : rooms[roomId]));
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`);
    var list = [];
    if (rooms[roomId]) {
      rooms[roomId].forEach((player) => {
        if (!player.id) {
          console.log(player);
        };
        if (player.id != socket.id) {
          list.push(player);
        };
      });
      rooms[roomId] = list;
      io.to(roomId).emit('update players', rooms[roomId]);
    }
  });

  socket.on('join private room', (roomId) => {
    if (rooms[roomId]) {
      var wanted = rooms[roomId].length;
      rooms[roomId].forEach(player => {
        if (player.id != socket.id) {
          wanted--;
          if (wanted === 0) {
            userSession.account.id = socket.id;
            rooms[roomId].push(userSession.account);
            socket.join(roomId);
            io.to(roomId).emit('update players', rooms[roomId] || []);
          };
        };
      });
    };
  });
});

http.listen(80, () => {
  console.log('Server is listening on port 80');
});