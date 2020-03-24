const express = require('express');
const authenticationController = require('./../controllers/authenticationController');

const streamingRouter = express.Router();

const streamingController = require('./../controllers/streamingController');

// streamingRouter.ws('/status', async (ws, req) => {
//   await authenticationController.protectWs(req, ws);

//   //ON CONNECION
//   console.log(`${req.user.email} Connected`);

//   //CHECK ONLINE/OFFLINE LOGIC:
//   ws.isAlive = true;
//   ws.on('pong', () => {
//     ws.isAlive = true;
//   });

//   const interval = setInterval(function ping() {
//     if (ws.isAlive === false) {
//       //DB OFFLINE
//       return ws.terminate();
//     }
//     ws.isAlive = false;
//     ws.ping(null);
//   }, 3000);

//   //---------------------------------------

//   //CHECK IF THE USER IS PLAYING MUSIC OR NOT:
//   let lastTime = 0;
//   let isPlaying = false;
//   const playing = setInterval(() => {
//     if (lastTime < Date.now() - 10000 && isPlaying) {
//       isPlaying = false;
//       //DB STOPPED PLAYING
//     }
//   }, 30000);
//   ws.on('message', msg => {
//     // console.log(`${msg} from ${req.user.email}`);
//     if (msg === 'streaming') {
//       if (!isPlaying) {
//         isPlaying = true;
//         //DB IS PLAYING
//       }
//       lastTime = Date.now();
//     }
//     ws.send(`yaba a dah ${msg}?`);
//   });

//   //ON CLOSING CONNECTION
//   ws.on('close', () => {
//     clearInterval(interval);
//     clearTimeout(playing);
//     console.log(`${req.user.email} Disconnected`);
//   });
// });

streamingRouter.get(
  '/:trackId',
  // authenticationController.protect,
  streamingController.downloadTrack
);
streamingRouter.post(
  '/',
  authenticationController.protect,
  streamingController.uploadTrack
);

module.exports = streamingRouter;
