const logger = require('koa-logger');
const router = require('koa-router')();
const onerror = require('koa-onerror')
const auth = require('basic-auth')
const axios = require('axios');
const bodyparser = require('koa-bodyparser')
const json = require('koa-json')
const moment = require('moment')
const mysql = require('promise-mysql')

const { dbcredentials, api_url, hook_url } = require('./config')

const Koa = require('koa');
const app = module.exports = new Koa();

onerror(app)

app.use(bodyparser({
    enableTypes: ['json', 'form', 'text']
}))
app.use(json())

app.use(logger());

router.post('/', add)
    .get('/enum', enumTypes)
    .get('/test', testPost);

app.use(router.routes());



async function enumTypes(ctx) {
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

        let conn = await mysql.createConnection(dbcredentials)
        let result = await conn.query('SELECT * FROM enumerations WHERE type="TimeEntryActivity"')
        conn.end();
        //console.log(result)
        ctx.body = result
    } else {
        ctx.status = 401
        ctx.body = {
            "_type": "Error",
            "errorIdentifier": "urn:openproject-org:api:v3:errors:Unauthenticated",
            "message": "Unauthenticated"
        }
    }
}


async function testPost(ctx) {

    //let totalHoursToday = await getTotalHours(3)
    let msg_template = {
        "text": "[LogTime] Added on " + new Date() +
            "\nUser: " + "user_name" + " (" + "user_email" + ")" +
            "\nProject: " + "project_name" +
            "\nWork Packages: " + "wp_name" +
            "\nSpent: " + "hours" + " (Hours)" +
            "\nDetails: " + "comments" +
            "\nTotal spent today: " + "totalHoursToday" + " (Hours)"
    }

    let hookToSlack = await axios({
        method: 'post',
        url: hook_url,
        headers: { 'Content-type': 'application/json' },
        data: msg_template
    })

    console.log(hookToSlack.status)
    console.log(hookToSlack)

    ctx.body = {
        "test": "test"
    }

}


async function getTotalHours(user_id) {
    let conn = await mysql.createConnection(dbcredentials)
    let result = await conn.query('SELECT SUM(hours) AS total FROM time_entries WHERE DATE(spent_on) = CURDATE() AND user_id = "' + user_id + '"')
    let rows = await result
    conn.end();
    console.log(rows[0]['total'])
    return rows[0]['total']
    /*console.log(rows)
    ctx.body = {
        "status": rows
    }*/
}


/*async function add(ctx) {
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
        let user_name = body['user_name']
        let user_email = body['user_email']
        let project_name = body['project_name']
        let wp_name = body['wp_name']
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
        let result = await conn.query('INSERT INTO time_entries (project_id, user_id, work_package_id, hours, comments, activity_id, spent_on, tyear, tmonth, tweek, created_on, updated_on) ' +
            'VALUES ("' + project_id + '", "' + user_id + '", "' + work_package_id + '", "' + hours + '", "' + comments + '", "' + activity_id + '", NOW(), "' + tyear + '", "' + tmonth + '", "' + tweek + '", NOW(), NOW())')
        conn.end();
        //let totalHoursToday = await getTotalHours(user_id)

        let msg_template = {
            "text": "[LogTime] Added on " + new Date() +
                "\nUser: " + user_name + " (" + user_email + ")" +
                "\nProject: " + project_name +
                "\nWork Packages: " + wp_name +
                "\nSpent: " + hours + " (Hours)" +
                "\nDetails: " + comments +
                "\nTotal spent today: " + "totalHoursToday" + " (Hours)"
        }


        let hookToSlack = await axios({
            method: 'post',
            url: hook_url,
            headers: { 'Content-type': 'application/json' },
            data: msg_template
        })

        console.log(hookToSlack)
        ctx.body = {
            "status": "success"
        }

    } else {
        ctx.status = 401
        ctx.body = {
            "_type": "Error",
            "errorIdentifier": "urn:openproject-org:api:v3:errors:Unauthenticated",
            "message": "Unauthenticated"
        }
    }
}*/

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
        console.log(body)
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
        let result = await conn.query('INSERT INTO time_entries (project_id, user_id, work_package_id, hours, comments, activity_id, spent_on, tyear, tmonth, tweek, created_on, updated_on) ' +
            'VALUES ("' + project_id + '", "' + user_id + '", "' + work_package_id + '", "' + hours + '", "' + comments + '", "' + activity_id + '", NOW(), "' + tyear + '", "' + tmonth + '", "' + tweek + '", NOW(), NOW())')
        conn.end();
        console.log(result)
        ctx.body = {
            "status": "success"
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
    console.log(err)
    ctx.body = { "error": "internal server error" }
});




if (!module.parent) app.listen(4000);