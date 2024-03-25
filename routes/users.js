var express = require('express');
var router = express.Router();

const usercontroller = require('../controller/user');
const companyControl = require('../controller/company');
const branchController = require('../controller/branch');
const projectController = require('../controller/project');
const taskTypeControlelr = require('../controller/taskType');
const userMaster = require('../controller/userMaster');
const userTypeMaster = require('../controller/userType');
const baseGroupMaster = require('../controller/baseGroup');
const taskModule = require('../controller/taskModule');
const workController = require('../controller/workEntry');
const ChatController = require('../controller/chatManagement');
const Project_Scheduler = require('../controller/project_schedule')
const TaskAssignControl = require('../controller/taskAssign')

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});


router.post('/resetpasswrd', usercontroller.updatepassword)


router.get('/taskid', usercontroller.filterouttaskid)
router.get('/empid', usercontroller.filteroutempid)

router.post('/notificationlist', usercontroller.notificationlist)
router.post('/createnotification', usercontroller.createnotification)
router.post('/projectreviewandfilter', usercontroller.projectreviewandfilter)
router.post('/projectreviewandfilteremployeebased', usercontroller.projectreviewandfilteremployeebased)


// Raj code 
router.post('/location', usercontroller.postLocation);
router.get('/location', usercontroller.getLocationByEmpAndDate)
router.post('/login', usercontroller.login)

router.get('/projectInvloved', usercontroller.projectInvolved);
router.get('/workstatus', usercontroller.workstatus);

router.get('/tasks', taskModule.getTasks)
router.post('/tasks', taskModule.createTask);
router.put('/tasks', taskModule.editTask);
router.delete('/tasks', taskModule.deleteTask);
router.get('/myTasks', taskModule.getMyTasks);
router.get('/tasksDropdown', taskModule.getTaskDropDown)

router.get('/startTask', workController.getTaskStartTime);
router.post('/startTask', workController.postStartTime);
router.delete('/startTask', workController.deleteTaskTime);

router.post('/saveWork', workController.postWorkedTask);
router.get('/myTodayWorks', workController.getEmployeeWorkedTask)

router.get('/subTask', taskModule.getSubTask);
router.post('/subTask', taskModule.postSubTask);
router.put('/subTask', taskModule.putSubTask);  
router.delete('/subTask', taskModule.deleteSubTask);

router.post('/assignEmployee', taskModule.assignEmployeeForTask);
router.put('/assignEmployee', taskModule.editAssignEmployeeForTask);
router.delete('/assignEmployee', taskModule.deleteAssignEmployeeForTask);

router.get('/taskStatus', usercontroller.getTaskStatus);

router.get('/getPagePermission', usercontroller.getPermission);
router.post('/updateAssignedEmployee', taskModule.removeAssignedEmp);

router.get('/company', companyControl.getCompany);
router.post('/company', companyControl.postCompany);
router.put('/company', companyControl.putCompany);
router.delete('/company', companyControl.deleteCompany);
router.get('/companyDropDown', companyControl.getCompanyDrowDown);

router.get('/branch', branchController.getBranch);
router.post('/branch', branchController.postBranch);
router.put('/branch', branchController.putBranch);
router.delete('/branch', branchController.deleteBranch);
router.get('/branchDropDown', branchController.getBranchDrowDown);

router.get('/projectDropDown', projectController.getProjectDropDown);
router.get('/project', projectController.getProject);
router.post('/project', projectController.postProject);
router.put('/project', projectController.editProject);
router.delete('/project', projectController.deleteProject);

router.get('/projectAbstract', projectController.getProjectAbstract);
router.get('/projectActivity', projectController.getTasksInProject);

router.get('/taskTypeDropDown', taskTypeControlelr.taskTypeDropDown)
router.get('/taskTypeGet', taskTypeControlelr.newTaskTypeDropDown)
router.get('/taskType', taskTypeControlelr.getTaskTyepe)
router.post('/taskType', taskTypeControlelr.postTaskType);
router.put('/taskType', taskTypeControlelr.editTaskType);
router.delete('/taskType', taskTypeControlelr.deleteTaskType);

router.get('/userType', userTypeMaster.getUserType);
router.post('/userType', userTypeMaster.postUserType);
router.put('/userType', userTypeMaster.editUserType);
router.delete('/userType', userTypeMaster.deleteUserType);

router.get('/users', userMaster.getUsers);
router.post('/users', userMaster.postUser);
router.put('/users', userMaster.editUser);
router.delete('/users', userMaster.deleteUser);
router.get('/userDropDown', userMaster.userDropdown);
router.get('/userName', userMaster.seletUsersName)

router.get('/baseGroup', baseGroupMaster.getBaseGroup);
router.post('/baseGroup', baseGroupMaster.postBaseGroup);
router.put('/baseGroup', baseGroupMaster.editBaseGroup);
router.delete('/baseGroup', baseGroupMaster.deleteBaseGroup);

router.get('/authentication', usercontroller.authUser);
router.get('/appMenu', usercontroller.getMenu);
router.get('/appMenuUType', usercontroller.getMenuByUserType)
router.post('/userBasedRights', usercontroller.modifyUserRights)
router.post('/userTypeBasedRights', usercontroller.modifyUserTypeRights);

router.get('/discussionTopic', ChatController.getTopics);
router.post('/discussionTopic', ChatController.createTopics);
router.put('/discussionTopic', ChatController.updateTopics);
router.delete('/discussionTopic', ChatController.deleteTopics);

router.post('/modifyTeam', ChatController.postTeamMembers);

router.get('/messages', ChatController.getTopicMessages);
router.post('/messages', ChatController.postMessages);

router.get('/files', ChatController.documentsListForTopic)
router.post('/files', ChatController.uploadFile);
router.get('/files/download', ChatController.downloadDocument);

router.get('/project/schedule/scheduleType', Project_Scheduler.getScheduleType);
router.get('/project/schedule', Project_Scheduler.getSchedule);
router.post('/project/schedule', Project_Scheduler.createSchedule);
router.put('/project/schedule', Project_Scheduler.putSchedule);
router.delete('/project/schedule', Project_Scheduler.deleteSchedule)

router.post('/project/schedule/scheduleTask', Project_Scheduler.assignTaskInSchedule)
router.put('/project/schedule/scheduleTask', Project_Scheduler.modifyTaskInSchedule)
router.delete('/project/schedule/scheduleTask', Project_Scheduler.deleteTaskInSchedule)


router.get('/todayTasks', TaskAssignControl.todayTasks)
router.get('/task/myTasks', TaskAssignControl.getEmployeeTasks)
router.get('/task/workDone', workController.getAllWorkedDataOfEmp)
router.get('/task/assignEmployee', TaskAssignControl.getAssignedEmployeeForTask)
router.post('/task/assignEmployee', TaskAssignControl.assignTaskForEmployee)
router.put('/task/assignEmployee', TaskAssignControl.putAssignTaskForEmployee)



module.exports = router;
