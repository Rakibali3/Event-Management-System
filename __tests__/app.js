const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../index");
const { expect } = require("expect");

//creating variables for later use 
let server, agent, signupResponse;

function extractCsrfToken(res) {
  if (!res || !res.text) {
    console.log('Invalid response or missing response text', res);
    return null;
  }
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

beforeAll(async () => {
  await db.sequelize.sync({ force: true });
  server = app.listen(3000, () => {});
  agent = request.agent(server);

  // Perform signup operation and store the response
  const signupRes = await agent
    .post("/signupsubmit")
    .send({
      firstName: "Test",
      lastName: "User A",
      email: "user.a@test.com",
      password: "12345678",
      _csrf: extractCsrfToken(await agent.get("/signup")),
    });

  signupResponse = signupRes;
});

afterAll(async () => {
  await db.sequelize.close();
  if (server) {
    server.close();
  }
});

describe("Signup and Login Tests", () => {
  // Signup test
  test("Sign up", async () => {
    const res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    const signupRes = await agent
      .post("/signupsubmit")
      .send({
        firstName: "Test",
        lastName: "User A",
        email: "user.a@test.com",
        password: "12345678",
        _csrf: csrfToken,
      });

    signupResponse = signupRes;

    expect(signupResponse.statusCode).toBe(302);
    expect(signupResponse.header.location).toBe("/home");
  });

  test("Log in", async () => {

    // Ensure signup was successful before attempting login
    if (!signupResponse) {
      console.error("signupResponse is undefined");
      return;
    }

    const loginPageResponse = await agent.get("/login");
    const csrfToken = extractCsrfToken(loginPageResponse);

    if (!csrfToken) {
      console.error("CSRF token is undefined");
      return;
    }

    // Perform login using the credentials used in signup
    const loginResponse = await agent.post("/userloginsubmit")
      .send({
        email: "user.a@test.com", // Using the email used in signup
        password: "12345678",      // Using the password used in signup
        _csrf: csrfToken,
      });

    expect(loginResponse.statusCode).toBe(302);
    expect(loginResponse.header.location).toBe("/home");
  });

  // Login test with invalid credentials
  test("Login with invalid credentials", async () => {
    const invalidCredentials = {
      email: "invaliduser@test.com",
      password: "invalidpassword",
    };

    const loginResponse = await agent.get("/login");
    const csrfToken = extractCsrfToken(loginResponse);
    const loginSubmitResponse = await agent.post("/userloginsubmit")
      .send({
        email: invalidCredentials.email,
        password: invalidCredentials.password,
        _csrf: csrfToken,
      });

    expect(loginSubmitResponse.statusCode).toBe(302);
    expect(loginSubmitResponse.header.location).toBe("/login");
  });
});
