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
