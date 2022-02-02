import App from './app';

const app = new App();

app.listen();

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});
