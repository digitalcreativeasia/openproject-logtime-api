const logger = require('koa-logger');
const router = require('koa-router')();
const onerror = require('koa-onerror')
const auth = require('basic-auth')
const axios = require('axios');
const bodyparser = require('koa-bodyparser')
const json = require('koa-json')
const moment = require('moment')
const mysql = require('promise-mysql')

const { dbcredentials, api_url, hook_url, checkuser } = require('./config')

const Koa = require('koa');
const app = module.exports = new Koa();

onerror(app)

app.use(bodyparser({
    enableTypes: ['json', 'form', 'text']
}))
app.use(json())

app.use(logger());

router.post('/', add)
    .post('/test', hook)
    .get('/enum', enumTypes)
    .get('/check', checkUser);

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


async function checkUser(ctx) {
    var user = auth(ctx.request)
    let response = await axios({
        method: 'get',
        url: api_url + checkuser,
        auth: {
            username: user.name,
            password: user.pass
        }
    })
    //console.log(JSON.stringify(response.data))
    if (response.status === 200) {
        ctx.body = JSON.stringify(response.data)
    } else {
        ctx.status = 401
        ctx.body = {
            "_type": "Error",
            "errorIdentifier": "urn:openproject-org:api:v3:errors:Unauthenticated",
            "message": "Unauthenticated"
        }
    }
}


async function getTotalHours(user_id) {
    let conn = await mysql.createConnection(dbcredentials)
    let result = await conn.query('SELECT SUM(hours) AS total FROM time_entries WHERE DATE(spent_on) = CURDATE() AND user_id = "' + user_id + '"')
    let rows = await result
    conn.end();
    console.log(rows[0]['total'])
    return rows[0]['total'].toFixed(2)
    /*console.log(rows)
    ctx.body = {
        "status": rows
    }*/
}


async function add(ctx) {
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
        let totalHoursToday = await getTotalHours(user_id)

        let msg_template = {
            "text": "[LogTime] Added on " + new Date() +
                "\nUser: " + user_name + " (" + user_email + ")" +
                "\nProject: " + project_name +
                "\nWork Packages: " + wp_name +
                "\nSpent: " + hours + " (Hours)" +
                "\nDetails: " + comments +
                "\nTotal spent today: " + totalHoursToday + " (Hours)"
        }


        let hookToSlack = await axios({
            method: 'post',
            url: hook_url,
            headers: { 'Content-type': 'application/json' },
            data: msg_template
        })

        //console.log(hookToSlack)
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


async function hook(ctx) {
    //check 
    let body = ctx.request.body
    //console.log(body)

    let action = body['action'].replace(":", " ").replace("_", " ");
    let project = body['_embedded']['project']['name'];
    let responsible = body['_embedded']['project']['responsible']['firstName'] + body['_embedded']['project']['responsible']['lastName']+" ("+body['_embedded']['project']['responsible']['login']+")";
    let workpackage = body['work_package']['subject']
    let percentage = body['work_package']['percentageDone']
    let updateAt = body['work_package']['updatedAt']

    let text = "Action: "+action+"\n"+
    "Update at: "+updateAt+"\n"+
    "Project: "+project+"\n"+
    "Work Packages: "+workpackage+"\n"+
    "Responsible: "+responsible+"\n"+
    "Percentage Done: "+percentage+"%\n";

    console.log(text)

    ctx.body = {
        "message": text
    }
}

app.on('error', (err, ctx) => {
    console.log(err)
    ctx.body = { "error": "internal server error" }
});




if (!module.parent) app.listen(4000);