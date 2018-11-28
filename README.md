# openproject-logtime-api
Time Log / Time entries API for OpenProject

Logging time entries currently not available on API V3 docs ( http://docs.openproject.org/apiv3-doc ). 
So I have created a simple API that allows you to add a Log Time/time entry via this API.

* `npm install`

* run `node app.js`

* `POST` to `http://host:4000`:
  
  * `Basic Auth` (See http://docs.openproject.org/apiv3-doc/#header-authentication) : 
    
    * `username`:  `apikey`
    * `password`: `<user_api_key>`
   
  * Body parameters in `application/x-www-form-urlencoded`
  
    * `project_id`:  `<project_id_id>` Integer
    * `user_id`: `<user_id>` Integer
    * `work_package_id`: `<work_packages_id>` Integer
    * `hours`: `hours of spent`: Float
    * `comments`: `comments max 250chars` String
    * `activity_id`: `<enumerations_id>` Integer
    
* Success indicate with status `200`


* Customization

  `time_entries`'s design table


| Field            | Type          | Null | Key | Default | Extra          |
|------------------|---------------|------|-----|---------|----------------|
| id               | int(11)       | NO   | PRI | NULL    | auto_increment |
| project_id       | int(11)       | NO   | MUL | NULL    |                |
| user_id          | int(11)       | NO   | MUL | NULL    |                |
| work_package_id  | int(11)       | YES  | MUL | NULL    |                |
| hours            | float         | NO   |     | NULL    |                |
| comments         | varchar(255)  | YES  |     | NULL    |                |
| activity_id      | int(11)       | NO   | MUL | NULL    |                |
| spent_on         | date          | NO   |     | NULL    |                |
| tyear            | int(11)       | NO   |     | NULL    |                |
| tmonth           | int(11)       | NO   |     | NULL    |                |
| tweek            | int(11)       | NO   |     | NULL    |                |
| created_on       | datetime      | NO   | MUL | NULL    |                |
| updated_on       | datetime      | NO   |     | NULL    |                |
| overridden_costs | decimal(15,4) | YES  |     | NULL    |                |
| costs            | decimal(15,4) | YES  |     | NULL    |                |
| rate_id          | int(11)       | YES  |     | NULL    |                |


