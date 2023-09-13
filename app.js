const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const bcrypt = require("bcrypt");

const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

app.get("/s", (request, response) => {
  response.send("www");
});

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await database.get(selectUserQuery);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`;
      const dbResponse = await database.run(createUserQuery);
      const newUserId = dbResponse.lastID;
      response.status = 200;
      response.send("User created successfully");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const dbUser = `
    select * from user 
    where username = '${username}';
  `;
  const result = await database.get(dbUser);
  if (result === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const hashedPassword = await bcrypt.compare(password, result.password);
    if (hashedPassword === true) {
      response.status = 200;
      response.send("Login success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const UserQuery = `
    select * from user 
    where username = '${username}';`;
  const result = await database.get(UserQuery);
  const hashedPassword = await bcrypt.compare(oldPassword, result.password);
  if (hashedPassword === true) {
    if (newPassword.length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      const Pass = await bcrypt.hash(newPassword, 10);
      const q = `
      update user 
      set password = '${newPassword}'
      where username = '${username}';
      `;
      const end = await database.run(q);
      response.status = 200;
      response.send("Password updated");
    }
  } else {
    response.status = 400;
    response.send("Invalid current password");
  }
});

initializeDbAndServer();
