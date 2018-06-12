/**
 * THIS IS THE ENTRY POINT FOR THE CLIENT, JUST LIKE server.js IS THE ENTRY POINT FOR THE SERVER.
 */
import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import createStore from './redux/create';
import io from 'socket.io-client';
import { Provider } from 'react-redux';
import ApiClient from './helpers/ApiClient.js';
import { Router, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import { ReduxAsyncConnect } from 'redux-async-connect';
import useScroll from 'scroll-behavior/lib/useStandardScroll';

import getRoutes from './routes';

const client = new ApiClient();
const _browserHistory = useScroll(() => browserHistory)();
const dest = document.getElementById('content');
const store = createStore(_browserHistory, client, window.__data);
const history = syncHistoryWithStore(_browserHistory, store);

function initSocket() {
  let socket = io('', {path: '/ws'});
  socket.on('snapshot', (data) => {
    console.log(data);
    // Kei Sing Wong -----
    // It seems like by setting socket to undefined in 'disconnect' without calling removeListener will cause memory leak.
    // However, since those events are still remain inact, such that when the data-streaming service avaiable again the socket will "reconnect" by itself.
    // Doesn't sound like a good solution for the reconnection mechanism.  Would need more time to investigate.
    // For now just need a check for the socket before issue the emit function.
    socket && socket.emit('my other event', { my: 'data from client' });
    // -------------------
  });
  socket.on('update', (data) => {
    console.log(data);
  });
  socket.on('disconnect', () => {
    socket = undefined;
  });
  return socket;
}
global.socket = initSocket();

const component = (
  <Router
    render={(props) =>
        <ReduxAsyncConnect {...props} helpers={{client}} filter={item => !item.deferred} />
      } history={history}>
    {getRoutes(store)}
  </Router>
);

ReactDOM.render(
  <Provider store={store} key="provider">
    {component}
  </Provider>,
  dest
);
