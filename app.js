//docs: https://octokit.github.io/node-github
const fs = require('fs');
const csvParse = require('csv-parse/lib/sync');
const request = require('request-promise');
const _ = require('lodash');

//authentication setup
const octokit = require('@octokit/rest')();
octokit.authenticate({
  type: 'oauth',
  token: fs.readFileSync('./github.token').toString()
})
const CANVAS_API_BASE = 'https://canvas.uw.edu/api/v1';
const CANVAS_KEY = fs.readFileSync('./canvas.key').toString();


/** Read Assignment Info **/

//Overall access stubs
const COURSE = require('./course.json');

//get single assignment from command line args (as -p argument; specify repo slug)
const args = require('minimist')(process.argv.slice(2));
if(args.p) {
  COURSE.assignments = COURSE.assignments.filter(a => a.repo_slug == args.p)
}


/** Scoring Script **/

//score ALL of the submissions in the course list
async function scoreAllAssignments() {
  const students = await getStudents('./students.csv');

  for(assignment of COURSE.assignments){
      await scoreSubmission(students, assignment).catch(console.error);
  }
}
scoreAllAssignments(); //run it


//score a single assignment for given students
async function scoreSubmission(students, assignment){
  for(student of students) {
    console.log(`Scoring ${assignment.repo_slug} for ${student.display_name}`);

    //get status of pushed code
    const statuses = await octokit.repos.getStatuses({
      owner: COURSE.github_org,
      repo: assignment.repo_slug+'-'+student.github,
      ref: assignment.branch || 'master' //default to master
    }).catch((err) => {
      console.log("Error accessing Githhub:", JSON.parse(err.message).message);
    })

    if(statuses && statuses.data[0] && statuses.data[0].state === 'success'){
      console.log(`...complete!`)
      await markComplete(student, assignment);
    } else {
      console.log(`...INCOMPLETE`);
    }
  }    
}

//Mark a particular student's assignment as complete (100%) in Canvas
async function markComplete(student, assignment) {
  let url = CANVAS_API_BASE + `/courses/${COURSE.canvas_id}/assignments/${assignment.canvas_id}/submissions/${student.canvas_id}`+`?access_token=${CANVAS_KEY}`;
  let req = { method:'PUT', uri: url, form: {submission: {posted_grade:'100%'}} }; //request
  return request(req).catch((err) => {
    console.error("Error marking submission: ", err.message);
  });
}



//read and compile student data (from Canvas and `students.csv`)
async function getStudents(studentFile) {
  let studentGitHubs = csvParse(fs.readFileSync(studentFile), {'columns':true});
  let canvasIds = await getEnrollments();
  let students = canvasIds.map((student) => {
    let match =  _.find(studentGitHubs, {uwnetid: student.uwnetid});
    return _.merge(student,match);
  })
  students = _.sortBy(students, ['display_name']); //ordering

  let githubLess = students.filter((s)=> s.github === undefined);
  if(githubLess.length > 0){
    console.log("Enrolled students without a GitHub account:")
    githubLess.forEach(console.log);
  }

  return students;
}

//fetch all student canvasIds from Canvas API
async function getEnrollments(){
  let PER_PAGE = 100;
  let url = CANVAS_API_BASE + `/courses/${COURSE.canvas_id}/enrollments?per_page=${PER_PAGE}&type=StudentEnrollment&access_token=${CANVAS_KEY}`
  let req = { method:'GET', uri: url }; //request  
  let enrollments = await request(req).then(JSON.parse);
  let studentIds = enrollments.map((item) => {
    return {
      canvas_id: item.user.id, 
      uwnetid: item.user.login_id,
      display_name: item.user.sortable_name
    }
  });
  return studentIds;
}
