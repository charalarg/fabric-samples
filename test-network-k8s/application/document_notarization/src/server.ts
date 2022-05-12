import App from './app';
import Redis from './services/redis.service';
import Mongo from './services/mongo.service';

const app = new App();

(async () => {
  try {
    await app.init();
    app.listen();
  } catch (error) {
    console.log(error);
    await (await Mongo.getInstance()).cleanUp();
    await Redis.getInstance().cleanUp();
  }
})();
