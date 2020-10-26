import React from 'react';
import Socket from './utilities/Socket';

import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      inGame: false,
      isVip: false,
      roomCode: '',
      username: '',
      inProgress: false,
      gameOver: false,
      stage: 0,

      // These are game specific
      promptResponse: '',
      promptIndex: 0,
      promptOne: null,
      promptTwo: null,
      answer: '',
      hasVoted: false,
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleStart = this.handleStart.bind(this);

    //Game specific
    this.handlePromptSubmit = this.handlePromptSubmit.bind(this);
    this.handleAnswerSubmit = this.handleAnswerSubmit.bind(this);
    this.handleVote = this.handleVote.bind(this);
  }

  componentDidMount() {
    Socket.connect();

    // We should be removing these event listeners too. Oh well
    Socket.addEventListener('joinedRoom', ({ player }) => {
      Socket.setPlayer(player);
      this.setState({ inGame: true, isVip: player.isVip, player });
    });

    Socket.addEventListener('startedGame', () => {
      this.setState({
        inProgress: true,
        stage: 0,
        promptIndex: 0
      });
    });

    Socket.addEventListener('stageChanged', ({ stage }) => {
      this.setState({ stage });
    });

    Socket.addEventListener('prompts', ({ promptOne, promptTwo }) => {
      this.setState({ promptOne, promptTwo, promptIndex: 0 });
    });

    Socket.addEventListener('answers', ({ promptOne, promptTwo }) => {
      this.setState({
        promptIndex: 0,
        hasVoted: false,
        promptOne,
        promptTwo
      })
    });

    Socket.addEventListener('promptChange', ({ promptIndex }) => {
      this.setState({ hasVoted: false, promptIndex });
    });

    Socket.addEventListener('gameOver', () => {
      this.setState({ gameOver: true });
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    Socket.joinRoom(this.state.roomCode, this.state.username);
  }

  handleStart() {
    Socket.startGame();
  }

  handlePromptSubmit(event) {
    event.preventDefault();
    Socket.submitPrompt(this.state.promptResponse);
    this.setState({ promptResponse: '' });
  }

  handleAnswerSubmit(event) {
    event.preventDefault();
    Socket.submitAnswer({ promptIndex: this.state.promptIndex, answer: this.state.answer });
    this.setState({ promptIndex: this.state.promptIndex + 1, answer: '' });
  }

  handleVote(answer) {
    Socket.vote(answer);
    this.setState({ hasVoted: true });
  }

  renderStageZero = () => {
    const vipString = this.state.isVip ? ' (VIP)' : '';
    return (
      <div className="app">
        <h1>{ `${this.state.username}${vipString}`}</h1>
        <p>{ 'Enter fun prompts for people to respond to' }</p>
        <form onSubmit={ this.handlePromptSubmit }>
          <label>Prompt:</label>
          <input
            value={ this.state.promptResponse }
            onChange={ (e) => this.setState({ promptResponse: e.target.value }) }
          />
          <input type="submit" value="Send" />
        </form>
      </div>
    )
  }

  renderStageOne = () => {
    if (!this.state.promptOne) {
      return null;
    }
    const vipString = this.state.isVip ? ' (VIP)' : '';

    if (this.state.promptIndex > 1) {
      return (
        <div className="app">
          <h1>{ `${this.state.username}${vipString}`}</h1>
          <h2>Sit back and relax while other players answer</h2>
        </div>
      );
    }
    const prompt = this.state.promptIndex === 0 ? this.state.promptOne : this.state.promptTwo;

    return (
      <div className="app">
        <h1>{ `${this.state.username}${vipString}`}</h1>
        <p>{ prompt.value }</p>
        <form onSubmit={ this.handleAnswerSubmit }>
          <label>Funny Answer:</label>
          <input
            value={ this.state.answer }
            onChange={ (e) => this.setState({ answer: e.target.value }) }
          />
          <input type="submit" value="Send" />
        </form>
      </div>
    );
  }

  renderStageTwo = () => {
    const prompt = this.state.promptIndex === 0 ? this.state.promptOne : this.state.promptTwo;
    const vipString = this.state.isVip ? ' (VIP)' : '';

    if (this.state.hasVoted) {
      return (
        <div className="app">
          <h1>{ `${this.state.username}${vipString}`}</h1>
          <h2>{ prompt.value }</h2>
          <h2>Thanks for voting! Wait for others to vote</h2>
        </div>
      );
    }

    const answerList = prompt.answers;
    const answers = answerList.map((answer) => {
      if (answer.player.id === Socket.player.id) {
        return null;
      }

      return <li><button onClick={ () => this.handleVote(answer) }>{ answer.value }</button></li>
    });

    return (
      <div className="app">
        <h1>{ `${this.state.username}${vipString}`}</h1>
        <h2>{ prompt.value }</h2>
        <ul>{ answers }</ul>
      </div>
    );
  }

  renderRoomInProgress = (stage) => {
    if (stage === 0) {
      return this.renderStageZero();
    } else if (stage === 1) {
      return this.renderStageOne();
    } else if (stage === 2) {
      return this.renderStageTwo();
    }

    return null;
  }

  renderRoomNotInProgress = () => {
    const vipString = this.state.isVip ? ' (VIP)' : '';
    const vipButton = this.state.isVip ? (
      <button onClick={ this.handleStart }>{ 'Start Game' }</button>
    ) : null;
    return (
      <div className="app">
        <h1>{ `${this.state.username}${vipString}`}</h1>
        <h2>{ this.state.roomCode }</h2>
        { vipButton }
      </div>
    );
  }

  renderGameOver = () => {
    const vipString = this.state.isVip ? ' (VIP)' : '';
    return (
      <div className="app">
        <h1>{ `${this.state.username}${vipString}`}</h1>
        <h2>Check out the screen to see the results!</h2>
      </div>
    );
  }

  render() {
    if (this.state.gameOver) {
      return this.renderGameOver();
    }

    if (this.state.inGame) {
      if (this.state.inProgress) {
        return this.renderRoomInProgress(this.state.stage);
      }

      return this.renderRoomNotInProgress();
    }

    return (
      <div className="app">
        <h1>Kendel Circle</h1>
        <h2>{ `Join a Room` }</h2>
          <form onSubmit={ this.handleSubmit }>
            <label>Username:</label>
            <input
              value={ this.state.username }
              onChange={ (e) => this.setState({ username: e.target.value }) }
            />
            <label>Room Code:</label>
            <input
              value={ this.state.roomCode }
              onChange={ (e) => this.setState({ roomCode: e.target.value }) }
            />
            <input type="submit" value="Join Room" />
          </form>
      </div>
    );
  }
}

export default App;
