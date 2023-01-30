const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");
let db = null;
const dbPath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());
const InitializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Database and server connected Successfully!!");
    });
  } catch (e) {
    console.log(`db error: ${e.message}`);
    process.exit(1);
  }
};
InitializeDbAndServer();

//API 1 register user

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  let isUserPresentQuery = `SELECT * FROM user WHERE username='${username}';`;
  const bcryptPassword = await bcrypt.hash(request.body.password, 10);
  const userPresent = await db.get(isUserPresentQuery);
  if (userPresent !== undefined) {
    response.status(400);

    response.send("User already exists");
  } else {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `INSERT INTO User(username,name,password,gender,location) 
          VALUES('${username}','${name}','${bcryptPassword}','${gender}','${location}');`;
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

//API login user
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  let ifUserPresentQuery = `SELECT * FROM user WHERE username='${username}';`;
  //const bcryptPassword = await bcrypt.hash(request.body.password, 10);
  const userPresent = await db.get(ifUserPresentQuery);

  if (userPresent == undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const validPassword = await bcrypt.compare(password, userPresent.password);
    if (validPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//API 3 for changing password

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userPresentQuery = `SELECT * FROM user WHERE username='${username}';`;
  const newHashedPassword = await bcrypt.hash(request.body.newPassword, 10);
  const isUserPresent = await db.get(userPresentQuery);
  if (isUserPresent !== undefined) {
    const comparePassword = await bcrypt.compare(
      oldPassword,
      isUserPresent.password
    );
    if (comparePassword === false) {
      response.status(400);
      response.send("Invalid current password");
    } else {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const updatePasswordQuery = `UPDATE user 
          SET
          password='${newHashedPassword}'
          WHERE 
          username='${username}';`;
        await db.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated");
      }
    }
  }
});
module.exports = app;
