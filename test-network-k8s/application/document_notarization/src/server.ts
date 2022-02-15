import App from './app';
import Redis from './services/redis.service';

const app = new App();
await app.init();

app.listen();

process.on('uncaughtException', async function (exception) {
  console.log(exception);
  await Redis.getInstance().cleanUp();
});
