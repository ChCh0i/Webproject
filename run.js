const express = require('express');
const session = require('express-session');
const csrf = require('csurf');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mysql = require('mysql');
const crypto = require('crypto');
const multer = require('multer'); // 이미지 업로드를 위한 미들웨어
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(session({
  secret: 'your-secret-key', // 세션을 암호화하기 위한 비밀키
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 3 * 60 * 60 * 1000, // 3시간 세션 유효
  },
}));


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // 'uploads' 폴더에 저장
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const username = req.body.username; // 사용자 계정 이름을 가져옴
    console.log(req.body.username);
    cb(null, `${username}${ext}`); // 사용자 계정 이름 + 확장자
  },
});

const upload = multer({ storage: storage });


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// 뷰 엔진 설정 (EJS를 사용)
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

//mysql 연결
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'test',  
  password: '1234',  
  database: 'testdb',  
});





/* Rendering */ 
connection.connect((err) => {
  if (err) {
    console.error('MySQL Connection Fail: ' + err.stack);
    return;
  }
  console.log('MySQL Connection Success');
});

app.get('/', (req, res) => {
  const user = req.session.user;
  const username = user ? user.username : 'Null';
  if (!req.session.user) {
    res.status(401).sendFile(__dirname + '/public/main.html');
    return;
  }
  res.status(200).sendFile(__dirname + '/public/main.html');
/* session hijacking  방어 코드
  if (req.session.user.ip !== req.ip) { //세션에 저장된 IP가 현재 IP와 동일한지 체크
                                        //session hijacking 방어
    req.session.destroy();
    res.status(401).send('세션이 만료되었습니다. 다시 로그인하세요.');
  } else {
    res.status(200).send(username);
    }
*/

});

app.get('/users', (req, res) => {
  connection.query('SELECT * FROM users', (error, results, fields) => {
    if (error) throw error;

    res.json(results);
  });
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
  });
  
app.get('/regi', (req, res) => {
  res.sendFile(__dirname + '/public/regi.html');
});

app.get('/findId', (req, res) => {
  res.sendFile(__dirname + '/public/findId.html');
});

app.get('/findPassword', (req, res) => {
  res.sendFile(__dirname + '/public/findPassword.html');
});

app.get('/profile', (req, res) => {
  const user = req.session.user;
  const username = user ? user.username : 'Null';
  if (!req.session.user) {
    res.status(401).sendFile(__dirname + '/public/main.html');
    return;
  }
  res.sendFile(__dirname + '/public/profile.html');
});

app.get('/commu', (req, res) => {
  const user = req.session.user;
  const username = user ? user.username : 'Null';
  if (!req.session.user) {
    res.status(401).sendFile(__dirname + '/public/main.html');
    return;
  }
  res.sendFile(__dirname + '/public/commu.html');
});

app.get('/write', (req, res) => {
  res.sendFile(__dirname + '/public/write.html');
});

app.get('/help', (req, res) => {
  res.sendFile(__dirname + '/public/help.html');
});

app.get('/test', (req, res) => {
  const user = req.session.user;
  const username = user ? user.username : 'Null';
  
  if (!req.session.user) {
    res.status(401).send('User session not found');
    return;
  }

  if (req.session.user.ip !== req.ip) { //세션에 저장된 IP가 현재 IP와 동일한지 체크
                                        //session hijacking 방어
    req.session.destroy();
    res.status(401).send('세션이 만료되었습니다. 다시 로그인하세요.');
  } else {
    res.status(200).send(`Hello: ${username}`);
    }
});

/* Rendering */ 

app.get('/upload', (req, res) => {
  res.sendFile(__dirname + '/public/upload.html');
});

// 이미지 업로드 처리
app.post('/upload', upload.single('image'), (req, res) => {
  res.redirect('/'); // 업로드 성공 후 메인 페이지로 리다이렉트
});


/* Request Process */ 

//Login Request
app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  console.log(username ,'Received a login request:', req.body);

  const clientIP = req.ip; 
  console.log(username , `login Request from IP: ${clientIP}`);

  const query = 'SELECT * FROM users WHERE username = ?';
  connection.query(query, [username], (error, results, fields) => {
    if (error) throw error;

    if (results.length === 0) {
      res.status(401).send('Invalid username or password');
      return;
    }

    const savedHash = results[0].password;
    const CompareHash = crypto.createHash('sha256').update(savedHash).digest('hex');
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');

    if (CompareHash === inputHash) {
      req.session.user = { username };
      req.session.user.ip = clientIP;

      console.log(username  ,'sessionID :', req.session.id);
      res.status(200).sendFile(__dirname + '/public/main.html');
    } else {
      res.status(401).send('Invalid password');
    }
  });
});

//Registered Request
app.post('/regi', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const name = req.body.name;
  const email = req.body.email;
  const passwordConfirm = req.body.passwordConfirm;

  const clientIP = req.ip; 
  console.log(username , `Registered Request from IP: ${clientIP}`);
  console.log(username ,'Received a regi request:', req.body);

  // 간단한 입력 유효성 검사 최소 8자 이상 64자 이하 특수문자1개 포함
  if (!username || !password) {
    res.status(401).send('NullData Error');
    return;
  }
// 비밀번호 유효성 검사
var passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

if (!passwordRegex.test(password)) {
  res.status(401).send('Invalid password format');
  return;
}

  // 이미 존재하는 사용자인지 확인
  const checkQuery = 'SELECT * FROM users WHERE username = ?';
  connection.query(checkQuery, [username], (error, results, fields) => {
    if (error) throw error;

    if (results.length > 0) {
      res.status(401).send('Username already exists');
      return;
    }

    // 사용자가 존재하지 않으면 새로운 사용자 등록
    const insertQuery = 'INSERT INTO users (username, password,name,email) VALUES (?, ?,?,?)';
    connection.query(insertQuery, [username, password,name, email], (error, results, fields) => {
      if (error) throw error;
      res.send('User registered successfully');
    });
  });
});

// ID 찾기 요청 처리
app.post('/findId', (req, res) => {
  const name = req.body.name;
  const email = req.body.email;

  const findIdQuery = 'SELECT username FROM users WHERE name = ? AND email = ?';
  connection.query(findIdQuery, [name, email], (error, results, fields) => {
    if (error) throw error;

    if (results.length === 0) {
      res.status(401).sendFile(__dirname + '/public/findId.html');
    } else {
      const foundId = results[0].username;
      res.status(200).send(`Found ID: ${foundId}`);
    }
  });
});

// 비밀번호 찾기 요청 처리 //쿼리 직접 삽입 일부로 취약하게 작성
app.post('/findPassword', (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const username = req.body.username;

  /* 사용자 입력을 매개변수로 받아 ?를 사용하여 SQL 인젝션을 방지
  const findPasswordQuery = 'SELECT password FROM users WHERE name = ? AND email = ? AND username = ?';
  connection.query(findPasswordQuery, [name, email, username], (error, results, fields) => {
  */

  
  const findPasswordQuery = `SELECT password FROM users WHERE name = '${name}' AND email = '${email}' AND username = '${username}'`;
  connection.query(findPasswordQuery, (error, results, fields) =>  {  if (error) throw error;

    if (results.length === 0) {
      res.status(401).sendFile(__dirname + '/public/findPassword.html');
    } else {
      console.log(req.body);
      const foundPassword = results[0].password;
      res.status(200).send(`Found Password: ${foundPassword}`);
    }
  });
});

//프로필
app.post('/profile', (req, res) => {

  const user = req.session.user;
  const username = user ? user.username : 'Null';

  if (username === 'Null'){
    res.status(401).send('User session not found');
    return;
  }

  const query = 'SELECT email, username, name, comment FROM users WHERE username = ?';
  connection.query(query, [username], (error, results, fields) => {
    if (error) throw error;

    if (results.length === 0) {
      res.status(401).send('Invalid username or password');
    } else {
      const userProfile = {
        email: results[0].email,
        name: results[0].name,
        username : results[0].username,
        comment : results[0].comment,
      };

      res.status(200).json(userProfile);
    }
  });
});

//프로필 코멘트 업데이트
app.post('/update_comment', (req, res) => {

  const user = req.session.user;
  const username = user ? user.username : 'Null';

  const updateQuery = 'UPDATE users SET comment = ? WHERE username = ?';
connection.query(updateQuery, [req.body.intro, username], (error, results, fields) => {
  if (error) throw error;

  if (results.affectedRows === 0) {
    res.status(401).send('No matching user found');
  } else {
    res.status(200).send('Comment updated successfully');
  }
});
});


//비밀번호 변경
app.post('/update_password', (req, res) => {

  const user = req.session.user;
  const username = user ? user.username : 'Null';
  const changepassword = req.body.changepassword;
  const password = req.body.password;

  // 기존 비밀번호 확인을 위한 쿼리
  const checkPasswordQuery = 'SELECT password FROM users WHERE username = ?';
  connection.query(checkPasswordQuery, [username], (checkError, checkResults, checkFields) => {
    if (checkError) throw checkError;

    if (checkResults.length === 0) {
      res.status(401).send('No matching user found');
    } else {
      const savedHash = checkResults[0].password;
      const inputHash = password;

      // 기존 비밀번호 일치 여부 확인
      if (savedHash === inputHash) {
        // 새로운 비밀번호로 업데이트
        const updateQuery = 'UPDATE users SET password = ? WHERE username = ?';
        connection.query(updateQuery, [changepassword, username], (error, results, fields) => {
          if (error) throw error;

          if (results.affectedRows === 0) {
            res.status(401).send('No matching user found');
          } else {
            req.session.destroy();
            res.status(200).send('Password updated successfully');
          }
        });
      } else {
        res.status(401).send('old password is incorrect');
      }
    }
  });
});


// 게시판
app.post('/write', (req, res) => {
  const user = req.session.user;
  const username = user ? user.username : 'Null';

  const findIdQuery = 'SELECT username FROM users WHERE name = ? AND email = ?';
  connection.query(findIdQuery, [name, email], (error, results, fields) => {
    if (error) throw error;

    if (results.length === 0) {
      res.status(401).sendFile(__dirname + '/public/write.html');
    } else {
      const foundId = results[0].username;
      res.status(200).send(`Found ID: ${foundId}`);
    }
  });
});

app.post('/logout', (req, res) => {-
  req.session.destroy();
});

  app.use((req, res) => {
    //res.status(403).send('403 Forbidden');
    res.sendFile(__dirname + '/public/main.html'); //메인페이지로 리다이렉트
  });


/* Request Process */ 

app.listen(port, () => {
  console.log(`http://localhost:${port} Run`);
});