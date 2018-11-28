const logger = require('koa-logger');
const router = require('koa-router')();
const onerror = require('koa-onerror')
const auth = require('basic-auth')
const axios = require('axios');
const bodyparser = require('koa-bodyparser')
const json = require('koa-json')

const { dbcredentials, api_url } = require('./config')

const Koa = require('koa');
const app = module.exports = new Koa();

onerror(app)

app.use(bodyparser({
    enableTypes: ['json', 'form', 'text']
}))
app.use(json())

app.use(logger());

router.post('/', add);

app.use(router.routes());


async function add(ctx) {
    //check 
    var user = auth(ctx.request)
    let response = await axios({
        method: 'get',
        url: api_url,
        auth: {
            username: user.name,
            password: user.pass
        }
    })
    if (response.status === 200) {
        let body = ctx.request.body
        let project_id = parseInt(body['project_id'])
        let user_id = parseInt(body['user_id'])
        let work_package_id = parseInt(body['work_package_id'])
        let hours = parseFloat(body['hours'])
        let comments = body['comments']
        let activity_id = parseInt(body['activity_id'])
        let spent_on = STR_TO_DATE(body['spent_on'], '%Y-%m-%d')
        let tyear
        let tmonth
        let tweek
        let created_on = new Date()
        let updated_on = new Date()
        
        //let overridden_costs
        //let costs
        //let rate_id
    } else {
        ctx.status = 401
        ctx.body = {
            "_type": "Error",
            "errorIdentifier": "urn:openproject-org:api:v3:errors:Unauthenticated",
            "message": "Unauthenticated"
        }
    }
}



app.on('error', (err, ctx) => {
    ctx.body = { "error": "internal server error" }
});




if (!module.parent) app.listen(4000);