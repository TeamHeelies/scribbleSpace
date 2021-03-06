import React, { Component } from 'react';
import LandingPage from './containers/LandingPage';
import ScribbleSpace from './components/ScribbleSpace';
import MainBoard from './components/MainBoard';
import CanvasApp from './components/CanvasApp'
import TextApp from './components/TextApp'
import Cookies from 'js-cookie'

const io = require('socket.io-client');
const socket = io();

class App extends Component {
  constructor(props) {
    super(props);
    this._isMounted = true;
    this.state = {
      name: null,
      roomName: null,
      password: null,
      loggedin: false,
      socketId: null,
      data: null
    };
    this.saveDrawingData = this.saveDrawingData.bind(this);
    this.handleChangeName = this.handleChangeName.bind(this);
    this.handleChangePassword = this.handleChangePassword.bind(this);
    this.handleChangeRoom = this.handleChangeRoom.bind(this);
    this.leaveRoom = this.leaveRoom.bind(this);
    this.loadBoard = this.loadBoard.bind(this);
    this.broadcastData = this.broadcastData.bind(this);
    // new methods
    this.createUser = this.createUser.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
  }

  // On componentDidMount life cycle method, these events to occur.
  // -Socket connection is created
  // - State is updated with unique socket ID
  // - This.state.data is updated with broadcast data.

  componentDidMount() {
    this._isMounted = true;
    socket.on('connect', () => {
      if (this._isMounted) this.setState({ socketId: socket.id });
    });
    socket.on('broadcast', data => {
      if (this._isMounted) this.setState({ data });
    });

    if (Cookies.get('username')) {
      this.setState({loggedin: true})
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  // Method Sends canvas drawing data to server
  // Must be invoked within the appropriate React component
  saveDrawingData(data) {
    fetch('/save', {
      headers: { 'Content-type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({ data })
    });
  }

  // HandleChangeName,HandleChangeRoom , HandleChangePassword - Obtains the name,room,and password from login form.
  handleChangeName(event) {
    console.log(event, 'EVENT TARGET', event.target.value);
    this.setState({ name: event.target.value });
  }

  handleChangeRoom(event) {
    console.log(event, 'EVENT TARGET', event.target.value);
    this.setState({ roomName: event.target.value });
  }

  handleChangePassword(event) {
    console.log(event, 'EVENT TARGET', event.target.value);
    this.setState({ password: event.target.value });
  }

  handleLogin(event) {
    event.preventDefault();

    console.log('A name was submitted: ', this.state.name, this.state.password);

    fetch('/login', {
      headers: { 'Content-type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({
        username: this.state.name,
        password: this.state.password
      })
    })
      .then(data => data.json())
      .then(data => {
        this.setState({loggedin: true})
        if(data.canEnter) window.location='/spaces'
      })
      .catch(err => console.log(err));
  }
  // Leave Room sets the state of "Logged in " to null.

  leaveRoom() {
    this.setState({ loggedin: null });
  }

  // Gets data from dateBase and renders canvas with data.

  loadBoard(loadCommand) {
    console.log('roomname', this.state.roomName);
    fetch('/load', {
      headers: { 'Content-type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({
        name: this.state.name,
        roomName: this.state.roomName,
        password: this.state.password,
        socketId: this.state.socketId
      })
    })
      .then(res => res.json())
      .then(data => {
        const db = JSON.stringify(data);
        console.log('loading ', db);
        this.setState({ data: db });
        // this.saveableCanvas.loadSaveData(data, true);
      });
  }

  // BroadcastData - Emits canvas data via the sockets to the server

  broadcastData(event) {
    const saveData = this.saveableCanvas.getSaveData();
    socket.emit('transfer', saveData);
  }

  // NEW METHODS
  createUser(userEvent, pwEvent) {
    const { username } = userEvent.target.username.value;
    const { password } = pwEvent.target.password.value;
    fetch('/createAccount', {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => console.log(data));
  }

  resetPassword(userEvent, pwEvent) {
    const { username } = userEvent.target.username.value;
    const { password } = pwEvent.target.newPassword.value;
    fetch('/resetPassword', {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => console.log(data));
  }

  render() {
    const landingPage = (
      <LandingPage
        name={this.name}
        handleChangeName={this.handleChangeName}
        password={this.password}
        handleChangePassword={this.handleChangePassword}
        // new methods
        createUser={this.createUser}
        resetPassword={this.resetPassword}
        handleLogin={this.handleLogin}
      />
    );
    const scribbleSpace = (
      <ScribbleSpace socketId={this.state.socketId} name={this.state.name} />
    );
    console.log('conditional render with state/cookie', this.state);
    if (this.state.loggedin) {
      return (
        <div className='drawsection'>
          <CanvasApp/>
          <TextApp />
        </div>
      );
    } else {
      return <div>{landingPage}</div>;
    }
  }
}

export default App;
