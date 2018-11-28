const logger = require('koa-logger');
const router = require('koa-router')();
const onerror = require('koa-onerror')
const auth = require('basic-auth')
const axios = require('axios');
const bodyparser = require('koa-bodyparser')
const json = require('koa-json')
const moment = require('moment')
const mysql = require('promise-mysql')

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
        let tyear = moment().year()
        let tmonth = moment().month()
        let tweek = parseInt(moment().format('W'))
        let created_on = new Date()
        let updated_on = new Date()
        
        let conn = await mysql.createConnection(dbcredentials)
        let result = conn.query('INSERT INTO time_entries (project_id, user_id, work_package_id, hours, comments, activity_id, spent_on, tyear, tmonth, tweek, created_on, updated_on) '+
        'VALUES ("'+project_id+'", "'+user_id+'", "'+work_package_id+'", "'+hours+'", "'+comments+'", "'+activity_id+'", NOW(), "'+tyear+'", "'+tmonth+'", "'+tweek+'", NOW(), NOW())')
        conn.end();
        console.log(result)
        //let overridden_costs
        //let costs
        //let rate_id



        ctx.body = {
            "test": "test"
        }
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