const logger = require('koa-logger');
const router = require('koa-router')();
const onerror = require('koa-onerror')

const Koa = require('koa');
const app = module.exports = new Koa();

onerror(app)

app.use(logger());

router.post('/', add);

app.use(router.routes());


async function add(ctx) {
  ctx.body = {"test": "test"}
}

app.on('error', (err, ctx) => {
    ctx.body = {"error": "internal server error"}
  });


if (!module.parent) app.listen(4000);