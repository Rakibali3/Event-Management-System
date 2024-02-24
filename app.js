const { connect } = require('./connectDB.js');
const Task = require('./db.js');
const Add = require('./addEvent.js');
const Reg = require('./register.js');
const express = require("express");
const ejs = require('ejs');
const multer = require('multer');
const app = express();
const bodyparser = require("body-parser");
const bcrypt = require('bcrypt');
const flash = require("connect-flash");
const saltRounds = 10;
// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(upload.single('eventImage'));  // Move Multer middleware here

const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const LocalStrategy = require('passport-local');

app.use(bodyparser.json());
app.use(express.urlencoded({ extended: false }));

const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
app.use(cookieParser("shh! some secret String"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
const { User, admin } = require("./models");
app.set("view engine", "ejs");
const path = require("path");
app.set("views", path.join(__dirname, "views"));
const { error, log } = require('console');
app.use(express.static(path.join(__dirname, "public")));

app.use(flash());

app.use(session({
  secret: "my-super-secret-key-1234567890",
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 //24 hrs
  },
  resave: false,
  saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});
//admin passport checkup

passport.use('admin', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, (username, password, done) => {
  admin.findOne({ where: { email: username } })
    .then(async function (admins) {
      if (!admins) {
        return done(null, false, { message: "Invalid admin Email or password" });
      }

      const res = await bcrypt.compare(password, admins.password);

      if (res) {
        return done(null, admins);
      } else {
        return done(null, false, { message: "Invalid admin Email or password" });
      }
    })
    .catch((error) => {
      return done(error);
    });
}));

// users
passport.use('user', new LocalStrategy({
  usernameField: 'email',  // Ensure this matches the name attribute in your login form
  passwordField: 'password'
}, (username, password, done) => {
  User.findOne({ where: { email: username } })
    .then(async function (user) {
      if (!user) {
        return done(null, false, { message: "Invalid Email or password" });
      }

      const res = await bcrypt.compare(password, user.password);

      if (res) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Invalid Email or password" });
      }
    })
    .catch((error) => {
      return done(error);
    });
}));


passport.serializeUser((user, done) => {
  if (user instanceof User) {
    console.log("serializing user in session", user.id);
    done(null, { id: user.id, userType: 'user' });
  } else if (user instanceof admin) {
    console.log("serializing admin in session", user.id);
    done(null, { adminId: user.id, userType: 'admin' });
  } else {
    done(new Error('Unknown user type'), null);
  }
});

passport.deserializeUser((data, done) => {
  if (data.userType === 'user') {
    User.findByPk(data.id)
      .then(user => {
        done(null, user);
      })
      .catch(error => {
        done(error, null);
      });
  } else if (data.userType === 'admin') {
    admin.findByPk(data.adminId)
      .then(admins => {
        done(null, admins);
      })
      .catch(error => {
        done(error, null);
      });
  } else {
    done(new Error('Unknown user type'), null);
  }
});


// Home Page Route

app.get("/", (req, res) => {
  res.render("home");
})
app.get("/event", (req, res) => {
  if (req.user instanceof admin) {
    res.render("ce", { csrfToken: req.csrfToken() });
  } else {
    res.redirect("/adminLogin");
  }
})

//for signup
app.get("/signup", (req, res) => {
  res.render("signup", { csrfToken: req.csrfToken() });
});

app.get('/home', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  const { Client } = require('pg');
  const client = new Client({
    host: "localhost",
    user: "postgres",
    password: "1234",
    port: 5432,
    database: "Event"
  })
  let count = -1;
  client.connect();
  if (req.user instanceof User) {
    client.query('select  count from public."Users" where id=$1', [req.user.id], (err, result) => {
      if (err) {
        console.log(err.message);
        return;
      }
      count = result.rows[0].count;
    });
  }
  client.query('select * from  public."Addevents"', (err, result) => {
    if (!err) {
      const data = result.rows.map(row => ({
        id: row.id,
        name: row.Name,
        loc: row.Location,
        date: new Date(row.Date).toDateString(),
        info: row.Information,
        Image: row.Image,
        registered_users: row.registered_users
      }))
      res.render(__dirname + '/views/card.ejs', { csrfToken: req.csrfToken(), Data: data, message: req.flash('success'), message: req.flash('delete'), count: count, userid: req.user.id });
    } else {
      console.log(err.message);
    }
    client.end;
  })
});

// canceling event
app.post('/cancel_:id', async (req, res) => {
  const eventId = req.params.id;
  const { Client } = require('pg');
  const client = new Client({
    host: "localhost",
    user: "postgres",
    password: "1234",
    port: 5432,
    database: "Event"
  })
  client.connect();
  const id = req.user.id;
  try {
    const register = await Reg.findOne({
      where: {
        UserId: id
      }
    });
    if (!register) {
      return res.status(404).send('Registration not found');
    }
    //deleting register of user
    await register.destroy();

    //dec count of user
    const user = await User.findByPk(id);
    user.count = user.count - 1;
    await user.save();

    //deleting user id from string
    const event = await Add.findByPk(eventId);
    if (!event) {
      return res.status(404).send('Event not found');
    }

    // Convert the registered_users string to an array of user IDs
    const registeredUsersArray = event.registered_users.split(',');

    // Find the index of the user's ID in the array
    const index = registeredUsersArray.indexOf(String(id));

    // If the user's ID is found, remove it from the array
    if (index !== -1) {
      registeredUsersArray.splice(index, 1);
    }

    // Join the array back into a string
    const updatedRegisteredUsers = registeredUsersArray.join(',');

    // Update the event in the database with the modified registered_users string
    await event.update({ registered_users: updatedRegisteredUsers });
    res.redirect("/home");
  } catch (error) {
    console.log(error.message);
  }
})
//for checking the signup details
app.post("/signupsubmit", async (req, res) => {
  console.log("CSRF Token:", req.csrfToken());

  // hashing pass using bcrypt
  const hashedpass = await bcrypt.hash(req.body.password, saltRounds)
  console.log(hashedpass);
  try {
    const user = await User.addUser({
      firstname: req.body.firstName,
      lastname: req.body.lastName,
      email: req.body.email,
      password: hashedpass,
    });
    req.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/home");
    })
  } catch (error) {
    console.log(error);
  }
});

//login
app.get('/login', (req, res) => {
  res.render("login", { csrfToken: req.csrfToken() });
})

// login submit for regular users
app.post(
  "/userloginsubmit",
  function (req, res, next) {
    passport.authenticate('user', function (err, user, info) {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.flash('error', 'Invalid Email or password');
        return res.redirect('/login');
      }
      req.logIn(user, function (err) {
        if (err) {
          return next(err);
        }
        return res.redirect('/home');
      });
    })(req, res, next);
  }
);

//logout
app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  })
})


// admin signup 
app.get('/adminSignup', (req, res) => {
  res.render("adminSignup", { csrfToken: req.csrfToken() });
})


//admin signup check
app.post('/adminsignupsubmit', async (req, res) => {
  console.log("CSRF Token:", req.csrfToken());

  // Hashing password using bcrypt
  const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

  try {

    // Using Sequelize's create method to add admin

    const admins = await admin.addAdmin({
      firstname: req.body.firstName,
      lastname: req.body.lastName,
      email: req.body.email,
      password: hashedPassword,
    });
    req.login(admins, (err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/adminlogin");
    })
  } catch (error) {
    console.log(error);
  }
});

//admin login

app.get('/adminlogin', (req, res) => {
  res.render("adminLogin", { csrfToken: req.csrfToken() });
})

// Admin login checkup
app.post(
  "/adminloginsubmit",
  passport.authenticate('admin', {
    failureRedirect: "/adminlogin",
    failureFlash: true,
  }),
  function (req, res) {
    res.redirect("/home");
  }
);

const ensureLoggedIn = async (req, res, next) => {
  const userId = req.user.id;

  // Fetch the user from the database
  const user = await User.findByPk(userId);

  if (req.user instanceof admin) {
    return res.status(500).send('Only Users can register!');
  }

  // Check if the user exists
  if (!user) {
    console.error("User not found");
    return res.status(404).send('User not found');
  }

  // Checking if the user reached the max limit to register for events 
  if (user.count >= 2) {
    return res.status(401).send('You have reached the max limit to register. Try again!');
  }

  // If the user is allowed to register, proceed to the next route
  next();
};

app.post("/register_:id", ensureLoggedIn, async (req, res) => {
  const EventId = req.params.id;
  const userId = req.user.id;

  try {
    const { Client } = require('pg');
    const client = new Client({
      host: "localhost",
      user: "postgres",
      password: "1234",
      port: 5432,
      database: "Event"
    });

    client.connect();

    // Fetch the event from the database
    let event;
    client.query('SELECT * FROM public."Addevents" WHERE id = $1', [EventId], async (err, result) => {
      if (err) {
        console.error("Error fetching event:", err.message);
        client.end();
        return res.status(500).send('Internal Server Error');
      }

      if (result.rows.length === 0) {
        console.error("Event not found");
        client.end();
        return res.status(404).send('Event not found');
      }

      event = result.rows[0];

      // Concatenate the new user ID to the existing string of user IDs
      if (!event.registered_users) {
        event.registered_users = userId.toString();
      } else {
        event.registered_users += ',' + userId.toString();
      }

      // Update the event in the database with the new registered users
      client.query('UPDATE public."Addevents" SET registered_users = $1 WHERE id = $2', [event.registered_users, EventId], async (updateErr, updateResult) => {
        if (updateErr) {
          console.error("Error updating event:", updateErr.message);
          client.end();
          return res.status(500).send('Internal Server Error');
        }

        // Proceed with the rest of your registration logic
        try {
          // Fetch the user from the database
          const user = await User.findByPk(userId);

          // Check if the user exists
          if (!user) {
            console.error("User not found");
            client.end();
            return res.status(404).send('User not found');
          }

          // checking if the user reached the max limit to register for events 
          if (user.count >= 2) {
            client.end();
            return res.status(404).send('You have reached the max limit to register. Try again!');
          }

          // Increment the count value
          user.count = user.count === null ? 1 : user.count + 1;

          // Save the updated user to the database
          await user.save();

          // Proceed with the rest of your registration logic
          const fname = req.body.fname;
          const lname = req.body.lname;
          const email = req.body.email;
          const mobileno = req.body.mobileno;
          const branch = req.body.branch;
          const year = req.body.year;
          const newReg = await Reg.create({
            firstName: fname,
            lastName: lname,
            email: email,
            phoneNo: mobileno,
            Branch: branch,
            Year: year,
            UserId: req.user.id,
          });

          console.log(`created task with Id: ${newReg.id}`);
          req.flash('success', 'Successfully registered for the event!');

          // Close the database connection
          client.end();

          res.redirect('/home');
        } catch (error) {
          console.log(error);
          client.end();
          res.status(500).send('Internal Server Error');
        }
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});



app.post('/addtask', async (req, res) => {
  try {
    // checking if event date is not helding in past
    if (new Date(req.body.eventDate) < new Date() || new Date(req.body.eventDate) == new Date()) {
      return res.status(400).send(" Event can't be in a past date");
    }
    // const csrfToken = req.csrfToken();

    const name = req.body.eventName;
    const location = req.body.eventLocation;
    const date = req.body.eventDate;
    const info = req.body.eventDescription;
    const image = req.file ? req.file.buffer : null;

    if (!name || !location || !info) {
      return res.status(400).send('Name, Location, and Information are required.');
    }

    const newEvent = await Add.create({
      Name: name,
      Location: location,
      Date: date,
      Information: info,
      Image: image,
      userid: req.user.id
    });

    console.log(`created task with Id: ${newEvent.id}`);
    res.redirect('/home');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


//for deleting card from DB

app.post('/delete_:id', async (req, res) => {
  const eventId = req.params.id;

  if (!eventId) {
    return res.status(400).send('Refresh your page once!');
  }

  try {
    let eventToDelete;

    // Check if the user is an admin
    if (req.user instanceof admin) {
      eventToDelete = await Add.findByPk(eventId);
    }

    if (!eventToDelete) {
      return res.status(403).send('Unauthorized access');
    }



    await Add.destroy({
      where: {
        id: eventId,
        userid: req.user.id,
      },
    });

    req.flash('delete', 'Successfully deleted event!');

    res.redirect('/home');
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/evo", (req, res) => {
  if (req.user instanceof User) {
    res.send("userEnvironment");
  } else if (req.user instanceof admin) {
    res.send("adminEnvironment");
  } else {
    res.redirect("/login");
  }
});

//for listening the port

if (!module.parent) {
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}

module.exports = app; 
