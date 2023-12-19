# 💻WEB Project
![js](https://img.shields.io/badge/HTML-239120?style=for-the-badge&logo=html5&logoColor=white) ![js](https://img.shields.io/badge/CSS-239120?&style=for-the-badge&logo=css3&logoColor=white) ![js](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=JavaScript&logoColor=white) ![js](	https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) ![js](	https://img.shields.io/badge/Python-14354C?style=for-the-badge&logo=python&logoColor=white) ![js](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white) ![js](https://img.shields.io/badge/Visual_Studio_Code-0078D4?style=for-the-badge&logo=visual%20studio%20code&logoColor=white)

## 개요
 - 간단하게 웹사이트 구축 및 취약한 코드를 인위적으로 삽입하여 해당 취약점 점검 목적으로 제작
 - 솔직하게 웹사이트를 꾸미고 싶은 마음이 더 컸던것 같습니다.
 - 아직 진행중인 프로젝트 이므로 천천히 완성해갈 계획 입니다.
 - 프론트엔드,백엔드,서버 구축 : 최준원

## Tree
 - 디렉토리 트리구조는 다음과 같습니다.
 - ![image](https://github.com/ChCh0i/Webproject/assets/108965611/8017745d-9af5-41d1-9e6e-053055b0bd5c)
 - 세션을 검증할때 토큰검증값(privatekey + 사용자ip + 시간)을 넣어 해당 사용자외 권한에 접근이 불가능하게 제작(취약점 있을수있음)
 - 해당 세션검증값을 통해 community에 접속가능 여부를 체크하고 로그인에 성공할시 profile에 접근가능하도록 설계

## main.html
 - <img width="841" alt="image" src="https://github.com/ChCh0i/Webproject/assets/108965611/dc9c028e-63f6-4528-9ca5-0b6079c2546d">
 - nav바 scroll시 따라오게 설정하는 javascript
```
var nav = document.getElementsByClassName("navbar");

window.onscroll = function sticky() {
    if(window.pageYOffset > nav[0].offsetTop) {
        nav[0].classList.add("nav");
    } else {
        nav[0].classList.remove("nav");
    }
}
```
 - main image를 시간초마다 자동으로 slide시키는 javascript
```
var slideIndex = 0;
showSlides();

function showSlides() {
    var i;
    var slides = document.getElementsByClassName("mySlides");

    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    slideIndex++;
    if (slideIndex > slides.length) {
        slideIndex = 1
    }
    slides[slideIndex - 1].style.display = "block";

    setTimeout(showSlides, 5000);
}
```

## SQLi
 - 사용자의 로그인정보를 불러올때 bind함수 및 블랙리스트 처리를 하지않아 SQLi 취약점이 발생하도록 유도
```
app.post('/findPassword', (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const username = req.body.username;

  const findPasswordQuery = `SELECT password FROM users WHERE name = '${name}' AND email = '${email}' AND username = '${username}'`;
  connection.query(findPasswordQuery, (error,results,fields) => { if (error) throw error;

  if (results.length === 0) {
    res.status(401).sendFile(__dirname + '/public/findPassword.html');
  } else {
    console.log(req.body);
    const foundPassword = results[0].password;
    res.status(200).send(`Found Password: ${foundPassword}`);
  }
}); 
```
 - SQLi 취약점이 발생하는 유저입력form
 - ![image](https://github.com/ChCh0i/Webproject/assets/108965611/d9dc3133-de32-4de5-a040-74c13d009a97)

## STORED XSS
 - comunity 게시물 add and filter code
```
function addPost() {
  const title = filterScript(document.getElementById('title').value);
  const content = filterScript(document.getElementById('content').value);
  const password = filterScript(document.getElementById('password').value);

  if (title && content && password) {
    const sessionId = getCookie('sessionId');
    const newPost = { title, content, password, author: sessionId};
    posts.push(newPost);
    updatePostList();
    clearPostForm();
    $('#postForm').hide();
  } else {
    alert('제목, 내용, 비밀번호를 모두 입력하세요.');
  }
}

function filterScript(text) {
  const lowerCaseText = text.toLowerCase();

  if (lowerCaseText.includes('<script')) {
    alert('스크립트는 혀용되지 않습니다.');
    return '';
  }
  return text;
}
```
 - 게시판 UI
 - ![image](https://github.com/ChCh0i/Webproject/assets/108965611/fadb9e84-f4b0-4283-947e-790251836bd5)
 - ![image](https://github.com/ChCh0i/Webproject/assets/108965611/bd8d9043-e03a-478e-a173-0e80fcf178b8)
 - ![image](https://github.com/ChCh0i/Webproject/assets/108965611/b3dc4ed1-4575-4b6b-98fd-3bc29749157f)
 - img src 를 통한 script필터링 우회
 - ![image](https://github.com/ChCh0i/Webproject/assets/108965611/8f88c924-b00b-4b13-ae9f-b53035db8e59)
 - bind함수와 gt,lt 등을 통한 블랙리스트 검증을 하여 필터링한다
 - ![image](https://github.com/ChCh0i/Webproject/assets/108965611/87ae9e8f-a70e-41c8-9998-92a1771047e4)

## session hijack
 - 세션 하이재킹 같은경우 공격자가 피해자의 세션id토큰을 가지고 있어야 하는방법이므로 xss를 통한 피해자의 token을 탈취 했다고 가정
 - 아래 코드는 유저 세션값을 생성하는 코드
```
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 3 * 60 * 60 * 1000,
  },
}));
```
 - 이후 아래이미지와 같이 세션값을 변조
 - ![image](https://github.com/ChCh0i/Webproject/assets/108965611/97de3095-d1a8-4898-9def-780dd607ebd4)
 - 생각한 시큐어코딩은 다음과 같다
```
if (req.session.user.ip !== req.ip) {
  req.session.destroy();
  res.status(401).send('세션이 만료되었습니다. 다시 로그인하세요.');
  } else {
    res.status(200).send(username);
  }
```
 - 사용자ip와 데이터베이스에 저장된 마지막 세션 접속 ip를 검증

## 마무리
 - 간단하게 작성한 코드들이고 다른 사람들이 작성한 코드들을 보며 부족한점이 많다는것을 깨달았습니다.
 - 시큐어코드 및 게시글 함수들도 수정이 좀 많이 필요할것같습니다.
 - 아직 완성단계는 아니고 천천히 완성해가겠습니다.. 언제 완성할지는 저도 잘..(머쓱)
