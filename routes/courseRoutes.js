const express = require('express');
let router = express.Router();
const pool = require('../config/db');
var multer = require("multer");
var upload = multer();
const xlsx = require('xlsx');

router.get("/list", async (req, res) => { // List of all the courses 
    try {
      const allCourses = await pool.query("SELECT * FROM course");
      res.json(allCourses.rows);
    } catch (err) {
      res.json(err)
    }
});


router.post("/addNewCourse", async (req, res) => { 
  try{
    await pool.query(
      "INSERT INTO course values ($1, $2, $3, $4);",
      [req.body.course_id, req.body.coursename, req.body.type, req.body.credits]
    );
    res.json("success");
  }
  catch(err){
    res.json(err)
  }
})

router.post("/addMultipleNewCourse", upload.single('file'), async (req, res) => { 
  try{
    const data = req.file.buffer;
    const wb = xlsx.read(data);
    const ws = wb.Sheets["Sheet1"];
    const list = xlsx.utils.sheet_to_json(ws, {
        raw: false,
    });
    const promises = list.map(async (course) => {
        await pool.query(
          "INSERT INTO course values ($1, $2, $3, $4);",
          [course.course_id, course.coursename, course.type, course.credits]
        );
        return "success";
    })
    const result = await Promise.all(promises);
    res.json(result);
  }
  catch(err){
    res.json(err);
  }
})

router.post("/updateCourse", async (req, res) => {
  try{
    await pool.query(
      "UPDATE course SET coursename=$2, type=$3, credits=$4 WHERE course_id=$1;",
      [req.body.course_id, req.body.coursename, req.body.type, req.body.credits]
    );
    res.json("success");
  }
  catch(err){
    res.json(err);
  }
})

router.post("/deleteCourse", async (req, res) => {
  try{
    await pool.query(
      'DELETE FROM availableCourses WHERE course_id=$1;',
      [req.body.course_id]
    );
    await pool.query(
      'DELETE FROM courseEnrollment WHERE course_id=$1;',
      [req.body.course_id]
    );
    await pool.query(
      'DELETE FROM course WHERE course_id=$1;',
      [req.body.course_id]
    );
    res.json("success");
  }
  catch(err){
    res.json(err);
  }
})

router.post("/addAvailableCourse",  async (req, res) => {
  try{
    await pool.query(
      "INSERT INTO availableCourses VALUES ($1, $2, $3, $4, $5, $6);",
      [req.body.course_id, req.body.semester, req.body.branch, req.body.totalSeats, req.body.totalSeats, req.body.grp]
    )
    res.json("success");
  }
  catch(err){
    res.json(err);
  }
})

router.post("/addMultipleAvailableCourse", upload.single('file'), async (req, res) => {
  try{
    const data = req.file.buffer;
    const wb = xlsx.read(data);
    const ws = wb.Sheets["Sheet1"];
    const list = xlsx.utils.sheet_to_json(ws, {
        raw: false,
    });
    const promises = list.map(async (course) => {
      await pool.query(
        "INSERT INTO availableCourses VALUES ($1, $2, $3, $4, $5, $6);",
        [course.course_id, course.semester, course.branch, course.totalSeats, course.totalSeats, course.grp]
      )
      return "success";
    })
    const result = await Promise.all(promises);
    res.json(result);
  }
  catch(err){
    res.json(err);
  }
})

/router.post("/updateTotalSeats", async (req, res) => {
  try{
    await pool.query(
      "UPDATE availableCourses SET availableSeats=$4, totalSeats=$4 WHERE course_id=$1 AND semester=$2 AND branch=$3",
      [req.body.course_id, req.body.semester, req.body.branch, req.body.totalSeats]
    )
    res.json("success");
  }
  catch(err){
    res.json(err);
  }
}) 

router.post("/getAvailableSeats", async (req, res) => {
  try{
    var data = await pool.query(
      "SELECT availableSeats from availableCourses WHERE course_id=$1 AND semester=$2 AND branch=$3;",
      [req.body.course_id, req.body.semester, req.body.branch]
    )
    res.json(data.rows[0].availableseats);
  }
  catch(err){
    res.json(err)
  }
})

router.post("/decreaseAvailableSeats", async (req, res) => {
  try {
    var data = await pool.query(
      "SELECT availableSeats from availableCourses  WHERE course_id=$1 AND semester=$2 AND branch=$3;",
      [req.body.course_id, req.body.semester, req.body.branch]
    )
    //res.json(data.rows[0].availableseats)
    if(data.rows[0].availableseats === 0){
      res.json("Seats Not Available");
    }
    else{
      await pool.query(
        "UPDATE availableCourses SET availableSeats=$4 WHERE course_id=$1 AND semester=$2 AND branch=$3;",
        [req.body.course_id, req.body.semester, req.body.branch, data.rows[0].availableseats-1]
      )
      res.json(data.rows[0].availableseats-1);
    }
  } catch (err) {
    res.json(err)
  }
})

router.post("/increaseAvailableSeats", async (req, res) => {
  try {
    var data = await pool.query(
      "SELECT * from availableCourses WHERE course_id=$1 AND semester=$2 AND branch=$3;",
      [req.body.course_id, req.body.semester, req.body.branch]
    )
    //res.json(data.rows[0])
    if(data.rows[0].availableseats === data.rows[0].totalseats){
      res.json("Not Allowed");
    }
    else{
      await pool.query(
        "UPDATE availableCourses SET availableSeats=$4 WHERE course_id=$1 AND semester=$2 AND branch=$3;",
        [req.body.course_id, req.body.semester, req.body.branch, data.rows[0].availableseats+1]
      )
      res.json(data.rows[0].availableseats+1);
    }
  } catch (err) {
    res.json(err)
  }
})

router.get("/deleteAllAvailableCourse", async (req, res) => {
  try{
    await pool.query('TRUNCATE TABLE availableCourses');
    res.json("success");
  }
  catch(err){
    res.json(err);
  }
})

router.post("/courseAvailibility", async (req, res) => {
  try{
    const data = await pool.query(
      "SELECT * FROM availableCourses WHERE course_id=$1",
      [req.body.course_id]
    )
    if(data.rows.length === 0){
      res.json("No Data Available");
    }
    else{
      res.json(data.rows);
    }
  }
  catch(err){
    res.json(err);
  }
})

router.post("/availableCoursesInSem", async (req, res) => {
  try{
    const data = await pool.query(
      "SELECT * FROM availableCourses WHERE semester=$1",
      [req.body.semester]
    )
    res.json(data.rows);
  }
  catch(err){
    res.json(err);
  }
})

router.post("/availableCoursesForBranch", async (req, res) => {
  try{
    const data = await pool.query(
      "SELECT * FROM availableCourses WHERE branch=$1",
      [req.body.branch]
    )
    res.json(data.rows);
  }
  catch(err){
    res.json(err);
  }
})

router.post("/getCoreCourses", async (req, res) => {
  try{
    const data = await pool.query(
      "select tbl1.course_id, coursename, credits from ( select * from course where type='CORE' ) tbl1 inner join ( select * from availablecourses where semester=$1 and branch=$2 ) tbl2 on tbl1.course_id = tbl2.course_id;",
      [req.body.semester, req.body.branch]
    )
    res.json(data.rows);
  }
  catch(err){
    res.json(err);
  }
})

router.post("/getElectiveCourses", async (req, res) => {
  try{
    const data = await pool.query(
      "select tbl1.course_id, coursename, credits, availableseats, grp from ( select * from course where type='ELECTIVE' ) tbl1 inner join ( select * from availablecourses where semester=$1 and branch=$2 ) tbl2 on tbl1.course_id = tbl2.course_id;",
      [req.body.semester, req.body.branch]
    )
    res.json(data.rows);
  }
  catch(err){
    res.json(err);
  }
})

router.post("/addEnrollment", async (req, res) => {
  try{
    await pool.query(
      "insert into courseEnrollment values ($1, $2);",
      [req.body.course_id, req.body.student_id]
    )
    res.json("success");
  }
  catch(err){
    res.json(err);
  }
})

router.post("/addMultipleEnrollment",upload.single('file'), async (req, res) => {
  try{
    const data = req.file.buffer;
    const wb = xlsx.read(data);
    const ws = wb.Sheets["Sheet1"];
    const list = xlsx.utils.sheet_to_json(ws, {
        raw: false,
    });
    const promises = list.map(async (enrollment) => {
        await pool.query(
          "insert into courseEnrollment values ($1, $2);",
          [enrollment.course_id, enrollment.student_id]
        )
        return "success"
    })
    const result = await Promise.all(promises);
    res.json(result);
  }
  catch(err){
    res.send(err);
  }
})

router.post("/deleteEnrollment", async (req, res) => {
  try{
    await pool.query(
      "delete from courseEnrollment where course_id=$1 and student_id=$2",
      [req.body.course_id, req.body.student_id]
    )
    res.json("success");
  }
  catch(err){
    res.json(err);
  }
})

router.post("/getEnrolledStudents", async (req, res) => {
  try{
    const data = await pool.query(
      "select tbl2.userid, name, joining_year, branch from (select * from courseEnrollment where course_id=$1) tbl1 inner join (select * from student ) tbl2 on tbl1.student_id = tbl2.userid;",
      [req.body.course_id]
    )
    res.json(data.rows);
  }
  catch(err){
    res.json(err);
  }
})

router.post("/getEnrolledCourses", async (req, res) => {
  try{
    const data = await pool.query(
      "select tbl1.course_id, coursename, type, credits from (select * from courseEnrollment where student_id=$1) tbl1 inner join (select * from course ) tbl2 on tbl1.course_id = tbl2.course_id;",
      [req.body.student_id]
    )
    res.json(data.rows);
  }
  catch(err){
    res.json(err);
  }
})

router.post("/isEnrolledInCourse", async (req, res) => {
  try{
    const data = await pool.query(
      "select * from courseEnrollment where course_id=$1 and student_id=$2;",
      [req.body.course_id, req.body.student_id]
    )
    if(data.rows.length === 1) res.json(true);
    else res.json(false);
  }
  catch(err){
    res.json(err);
  }
})
 

module.exports = router; 