const logger = require('koa-logger');
const router = require('koa-router')();
const onerror = require('koa-onerror')
const auth = require('basic-auth')
const axios = require('axios');
const bodyparser = require('koa-bodyparser')
const json = require('koa-json')
const moment = require('moment')
const mysql = require('promise-mysql')

const { dbcredentials, api_url, hook_url, checkuser, op_hook } = require('./config')

const Koa = require('koa');
const app = module.exports = new Koa();

onerror(app)

app.use(bodyparser({
    enableTypes: ['json', 'form', 'text']
}))
app.use(json())

app.use(logger());

router.post('/', add)
    .post('/op', hook)
    .get('/enum', enumTypes)
    .get('/check', checkUser);

app.use(router.routes());


function durToHours(duration) {
    var match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

    match = match.slice(1).map(function (x) {
        if (x != null) {
            return x.replace(/\D/, '');
        }
    });

    var hours = (parseInt(match[0]) || 0);
    var minutes = (parseInt(match[1]) || 0);
    var seconds = (parseInt(match[2]) || 0);

    return ((hours * 3600 + minutes * 60 + seconds) / 3600).toFixed(1)
        ;
}



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
    let project = body['work_package']['_embedded']['project']['name'];
    let projectIdentifier = body['work_package']['_embedded']['project']['identifier'];
    let status = body['work_package']['_embedded']['status']['name'];
    let responsible = body['work_package']['_embedded']['responsible']['firstName'] + " " + body['work_package']['_embedded']['responsible']['lastName'] + " (" + body['work_package']['_embedded']['responsible']['login'] + ")";
    let assignee = body['work_package']['_embedded']['assignee']['firstName'] + " " + body['work_package']['_embedded']['assignee']['lastName'] + " (" + body['work_package']['_embedded']['assignee']['login'] + ")";
    let workpackage = body['work_package']['subject']
    let workpackageId = body['work_package']['id']
    let percentage = body['work_package']['percentageDone']
    let updateAt = body['work_package']['updatedAt']
    let authorLink = body['work_package']['_embedded']['responsible']['id']
    let authorAva = body['work_package']['_embedded']['responsible']['avatar']
    let duration = body['work_package']['spentTime']
    let typeTask = body['work_package']['_embedded']['type']['name']
    let priority = body['work_package']['_embedded']['priority']['name']

    console.log(duration)

    let uaStr = ""+new Date(updateAt)+"";

    console.log(uaStr);

    let durStr = durToHours(duration);

    console.log(durStr)

    let payload = {
        "text": ":package: *" + action + "*",
        "attachments": [
            {
                "fallback": "Required plain-text summary of the attachment.",
                "color": "#36a64f",
                "author_name": responsible,
                "author_link": "http://holiday.digitalcreativeasia.com/project/project/users/" + authorLink,
                "author_icon": authorAva,
                "title": project,
                "title_link": "http://holiday.digitalcreativeasia.com/project/projects/" + projectIdentifier,

                "fields": [
                    {
                        "title": ":fire: Workpacakage",
                        "value": "<http://holiday.digitalcreativeasia.com/project/projects/smart-cluster/work_packages/" + workpackageId + "|" + workpackage + ">",
                        "short": false
                    },
                    {
                        "title": ":runner: Update At",
                        "value": uaStr,
                        "short": false
                    },
                    {
                        "title": ":memo: Status",
                        "value": status,
                        "short": true
                    },
                    {
                        "title": ":hourglass: Progress",
                        "value": percentage + "%",
                        "short": true
                    },
                    {
                        "title": ":nail_care: Spent",
                        "value": durStr+"Hrs",
                        "short": true
                    },
                    {
                        "title": ":rowboat: Type & Priority",
                        "value": typeTask+" - "+priority,
                        "short": true
                    },
                    {
                        "title": ":cop: Assignee:",
                        "value": assignee,
                        "short": false
                    },
                    {
                        "title": ":man_with_turban: Responsible:",
                        "value": responsible,
                        "short": false
                    }
                ],
                "thumb_url": "https://www.digitalcreativeasia.com/wp-content/uploads/2018/09/dca-new-logo-footer.png",
                "footer": "DC-Asia",
                "footer_icon": "https://avatars3.githubusercontent.com/u/41264133?s=200&v=4"
            }
        ]
    }

    let text = "Action: " + action + "\n" +
        "Update at: " + new Date(updateAt) + "\n" +
        "Project: " + project + "\n" +
        "Work Packages: " + workpackage + "\n" +
        "Status: " + status + "\n" +
        "Responsible: " + responsible + "\n" +
        "Percentage Done: " + percentage + "%\n";

    console.log(text)




    let hookToSlack = await axios({
        method: 'post',
        url: op_hook,
        headers: { 'Content-type': 'application/json' },
        data: payload
    })

    ctx.body = {
        "message": text
    }
}

app.on('error', (err, ctx) => {
    console.log(err)
    ctx.body = { "error": "internal server error" }
});




if (!module.parent) app.listen(4000);