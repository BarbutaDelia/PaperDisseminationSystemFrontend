const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const sqlite3 = require('sqlite3');
const requestIp = require('request-ip');
const myApi = require("./myApi")
const querystring = require('querystring');
const multer = require('multer');
const upload = multer();


const SECRET_KEY = "PaperDisseminationSystemSecretKey"
const app = express();

const port = 6789;

// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(
    session({
        secret: SECRET_KEY,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false,
            httpOnly: true
        }
    })
);

// TODO unde e req.session.token = null trebuie si req.session.userId = null;
app.get('/login', (req, res) => {
    if (req.session.error == null || req.session.error == undefined) {
        res.render('login', { alert: false, status: false, isLoggedIn: null });
    }
    else {
        let message = req.session.error;
        req.session.error = null;
        res.render('login', { alert: true, result: message, status: false, isLoggedIn: null });
    }
});

app.post('/login', (req, res) => {
    let loginReq = req.body
    myApi.login(loginReq, (results, status) => {
        if (status) {
            req.session.token = results.token;
            req.session.userId = results.id;
            res.redirect('/');
        }
        else {
            res.render('login', { alert: true, result: results, status: false, isLoggedIn: null });
        }
    })
});

app.get('/signup', (req, res) => {
    res.render('signup', { alert: false, isLoggedIn: null });
});

app.get('/add-article', (req, res) => {
    if (req.session.token == null || req.session.token == undefined) {
        res.redirect('/');
    }
    else {
        myApi.getTagLevels(req.session.token, (tagLevels) => {
            if (req.session.error === null || req.session.error === undefined) {
                res.render('add-article', { alert: false, isLoggedIn: req.session.token, tagLevels: tagLevels });
            }
            else {
                let message = req.session.error;
                req.session.error = null;
                res.render('add-article', { alert: true, result: message, status: false, isLoggedIn: req.session.token, tagLevels: tagLevels });
            }
        });
    }
});

app.post('/add-article', upload.single('file'), (req, res) => {
    let title = req.body.title;
    let description = req.body.description;
    let authors = [];
    if (req.body.authors !== "") {
        authors = req.body.authors.split(',').map(author => author.trim().replace(/\s*,\s*/g, ','));
    }
    let tagLevels = req.body.tags;
    let file = req.file;

    if (tagLevels !== undefined) {
        tagLevels = tagLevels.reduce((result, current) => {
            const [tag, level] = current.split(': ');
            result[tag] = level;
            return result;
        }, {});
    }

    myApi.addArticle({ title, description, authors, tagLevels, file }, req.session.token, (results, status) => {
        if (status) {
            req.session.articleId = results;
            res.redirect('/article-payment');
        }
        else {
            if (results.includes("Please log in again")) {
                req.session.token = null;
                req.session.error = results;
                return res.redirect('/login');
            }
            else {
                req.session.error = results;
                res.redirect('/add-article');
            }
        }
    });
});

app.get('/article-payment', (req, res) => {
    let articleId = req.session.articleId.id;
    req.session.articleId = null;
    res.render('article-payment', { articleId: articleId, isLoggedIn: req.session.token })
});

app.post('/signup', (req, res) => {
    let signupReq = req.body
    myApi.registerUser(signupReq, (results, status) => {
        res.render('signup', { alert: true, result: results, status: status, isLoggedIn: null })
    });
})

app.get('/', (req, res) => {
    myApi.getArticles((results) => {
        if (req.session.error === null || req.session.error === undefined) {
            res.render('index', { articles: results, isLoggedIn: req.session.token });
        }
        else {
            let message = req.session.error;
            req.session.error = null;
            res.render('index', { alert: true, result: message, status: false, articles: results, isLoggedIn: req.session.token })
        }
    });
});

app.get('/article/:id', (req, res) => {
    myApi.getArticle(req.params.id, (results, status) => {
        if (status) {
            res.render('article', { isLoggedIn: req.session.token, article: results });
        }
        else {
            res.redirect('/');
        }
    });

});

app.get('/badges', (req, res) => {
    if (req.session.token == null || req.session.token == undefined) {
        res.redirect('/');
    }
    else {
        myApi.getBadges(req.session.token, (results, status) => {
            if (req.session.error == null || req.session.error == undefined) {
                if (status) {
                    res.render('badges', { tags: results, isLoggedIn: req.session.token });
                }
                else {
                    req.session.token = null;
                    req.session.error = results;
                    return res.redirect('/login');
                }
            }
            else {
                let message = req.session.error;
                req.session.error = null;
                res.render('badges', { alert: true, result: message, status: false, tags: results, isLoggedIn: req.session.token });
            }
        });
    }
});

app.get('/test/:id', (req, res) => {
    myApi.getTest(req.session.token, req.params.id, (results, status) => {
        if (req.session.error === null || req.session.error === undefined) {
            if (status) {
                res.render('test', { isLoggedIn: req.session.token, test: results, testId: req.params.id });
            }
            else {
                if (results.includes("Sorry, you have attempted the test too recently")) {
                    req.session.error = results;
                    return res.redirect('/badges');
                }
                if (results.includes("Please obtain your badge")) {
                    req.session.error = results;
                    req.session.tagId = req.params.id;
                    return res.redirect('/view-score');
                }
                if (results.includes("Please log in again")) {
                    req.session.error = results;
                    req.session.token = null;
                    return res.redirect('/login');
                }
                else {
                    return res.redirect('/');
                }
            }
        }
        else {
            req.session.error = results;
            req.session.tagId = req.params.id;
            return res.redirect('/view-score');
        }
    });
});

app.post('/test/:id', (req, res) => {
    let test = req.body;
    let answerIds;
    if (test.answers !== undefined) {
        answerIds = {
            answerIds: test.answers.map(Number)
        };
    }
    else {
        answerIds = {
            answerIds: []
        };
    }
    myApi.computeTestScore(req.session.token, req.params.id, answerIds, (results, status) => {
        if (status) {
            res.render('view-score', { isLoggedIn: req.session.token, test: results, testId: req.params.id });
        }
        else {
            if (results.includes("Please log in again")) {
                req.session.error = results;
                req.session.token = null;
                return res.redirect('/login');
            }
            else {
                req.session.error = results;
                res.redirect('/test/' + req.params.id);
            }
        }
    });
});

app.get('/view-score', (req, res) => {
    if (req.session.error === null || req.session.error === undefined) {
        if (req.session.token === null || req.session.token === undefined) {
            return res.redirect('/');
        }
        else {
            try {
                var validJson = JSON.parse(results);
                res.render('view-score', { isLoggedIn: req.session.token, test: results, testId: req.params.id });
            } catch (e) {
                return res.redirect('/badges');
            }
        }
    }
    else {
        req.session.error = null;
        let tagId = req.session.tagId;
        req.session.tagId = null;
        myApi.getCIDForLatestTest(req.session.token, req.session.userId, tagId, (results, status) => {
            if (status) {
                res.render('view-score', { isLoggedIn: req.session.token, test: results, testId: tagId });
            }
            else {
                if (results.includes("Please log in again")) {
                    req.session.error = results;
                    req.session.token = null;
                    return res.redirect('/login');
                }
                else {
                    req.session.error = results;
                    return res.redirect('/badges');
                }
            }
        });
    }
});

app.get('/my-badges', (req, res) => {
    if (req.session.token === null || req.session.token === undefined) {
        return res.redirect('/');
    }
    else {
        res.render('my-badges', { isLoggedIn: req.session.token });
    }
});

app.post('/logout', (req, res) => {
    myApi.logout(req.session.token, (results, status) => {
        if (status) {
            req.session.token = null;
            req.session.userId = null;
            res.redirect('/login');
        }
        else {
            if (results === "Unauthorized") {
                res.redirect('/login');
            }
            else {
                req.session.error = results;
                res.redirect('/');
            }
        }
    });
})

app.use(function (req, res) {
    res.status(404);
    if (res.statusCode == 404) {
        if (req.session.accessCounter == null) {
            req.session.accessCounter = 1
        }
        else {
            req.session.accessCounter++
        }
    }
    // console.log(req.session.accessCounter)
    if (req.session.accessCounter > 5) {
        req.session.blockedIp = req.session.blockedIp || [];
        let clientIp = requestIp.getClientIp(req);
        // console.log(clientIp);
        if (!req.session.blockedIp.includes(clientIp)) {
            req.session.blockedIp.push(clientIp)
            // console.log(req.session.blockedIp)
        }
    }
    res.render('eroare-404')
    return
});
app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:` + port));