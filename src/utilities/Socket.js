import io from 'socket.io-client';

const Socket = {
  endpoint: 'http://127.0.0.1:3001',
  socket: null,
  roomCode: null,
  player: null,

  // eventListeners: {},

  onJoinedRoom: null,

  addEventListener(eventName, callback) {
    this.socket.on(eventName, callback);
    // TODO: allow multiple events
    // if (!this.eventListeners[eventName]) {
    //   this.eventListeners[eventName] = [callback];
    //   this.socket.on(eventName, (response) => {
    //
    //   })
    // } else {
    //   this.eventListeners[eventName].push(callback);
    // }
  },

  connect() {
    this.socket = io('http://127.0.0.1:3001');
  },

  joinRoom(roomCode, username) {
    this.roomCode = roomCode;
    this.socket.emit('joinRoom', { roomCode, username });
  },

  startGame() {
    this.socket.emit('startGame', { roomCode: this.roomCode })
  },

  setPlayer(player) {
    this.player = player;
    return player;
  },

  submitPrompt(prompt) {
    // TODO: Should track who is sending them
    this.socket.emit('submitPrompt', { roomCode: this.roomCode, prompt });
  },

  submitAnswer({ promptIndex, answer }) {
    this.socket.emit('submitAnswer', {
      roomCode: this.roomCode,
      player: this.player,
      promptIndex,
      answer
    });
  },

  vote(answer){
    this.socket.emit('vote', {
      roomCode: this.roomCode,
      answer
    });
  }
};

export default Socket;
