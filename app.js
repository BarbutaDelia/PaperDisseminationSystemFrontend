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
        res.render('login', { alert: false, status: false, isLoggedIn: null, user: {email: '', password: ''} });
    }
    else {
        let message = req.session.error;
        req.session.error = null;
        res.render('login', { alert: true, result: message, status: false, isLoggedIn: null, user: {email: '', password: ''} });
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
            res.render('login', { alert: true, result: results, status: false, isLoggedIn: null, user: {email: loginReq.email, password: loginReq.password}});
        }
    })
});

app.get('/signup', (req, res) => {
    res.render('signup', { alert: false, isLoggedIn: null, user: null });
});

app.post('/signup', (req, res) => {
    let signupReq = req.body
    myApi.registerUser(signupReq, (results, status) => {
        return res.redirect('/login')
    });
})

app.get('/about', (req, res) => {
    res.render('about', { alert: false, isLoggedIn: req.session.token});
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
        if (req.session.error === null || req.session.error === undefined) {
            if (req.session.reviewMessage === null || req.session.reviewMessage === undefined) {
                if (status) {
                    res.render('article', { isLoggedIn: req.session.token, article: results });
                }
                else {
                    res.redirect('/');
                }
            }
            else {
                let message = req.session.reviewMessage;
                req.session.reviewMessage = null;
                res.render('article', { alert: true, result: message, status: true, isLoggedIn: req.session.token, article: results });
            }
        }
        else {
            let message = req.session.error;
            req.session.error = null;
            res.render('article', { alert: true, result: message, status: false, isLoggedIn: req.session.token, article: results });
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

app.get('/review-article/:id', (req, res) => {
    if (req.session.token === null || req.session.token === undefined) {
        return res.redirect('/');
    }
    else {
        myApi.getReviewCriteria(req.session.token, req.params.id, (results, status) => {
            if (status) {
                res.render('review-article', { isLoggedIn: req.session.token, reviewCriteria: results, articleId: req.params.id });
            }
            else {
                if (results.includes("Please log in again")) {
                    req.session.error = results;
                    req.session.token = null;
                    return res.redirect('/login');
                }
                else {
                    req.session.error = results;
                    return res.redirect('/article/' + req.params.id);
                }
            }
        });
    }
});

app.post('/review-article/:id', (req, res) => {
    let reviewReq = req.body;
    let reviewCriteriaGrades = Object.keys(reviewReq.reviewCriterion).reduce((result, key) => {
        let criterionId = key.split('_')[2];
        result[criterionId] = parseInt(reviewReq.reviewCriterion[key]);
        return result;
    }, {});

    let finalReq = {
        articleId: parseInt(reviewReq.articleId),
        reviewCriteriaGrades: reviewCriteriaGrades,
        recommendation: reviewReq.recommendation
    };
    myApi.submitReview(req.session.token, finalReq, (results, status) => {
        if (status) {
            // req.session.submittedReview = "Your review has been submitted, thank you for your contribution!"
            // return res.redirect('/') sau res.redirect('/article/id');
            req.session.reviewMessage = results;
            return res.redirect('/article/' + req.params.id);
        }
        else {
            if (results.includes("Please log in again")) {
                req.session.error = results;
                req.session.token = null;
                return res.redirect('/login');
            }
            else {

            }
        }
    });
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
});

app.get('/my-articles', (req, res) => {
    if (req.session.token === null || req.session.token === undefined) {
        return res.redirect('/');
    }
    else {
        myApi.getUserArticles(req.session.token, req.session.userId, (results, status) => {
            if(status){
                res.render('my-articles', { articles: results, isLoggedIn: req.session.token });
            }
        });
    }
});

app.get('/my-article-reviews/:id', (req, res) => {
    if (req.session.token === null || req.session.token === undefined) {
        return res.redirect('/');
    }
    else {
        myApi.getArticleReviews(req.session.token, req.params.id, (reviews, status) => {
            if(status){
                myApi.getReviewCriteria(req.session.token, req.params.id, (results, status) => {
                    if (status) {
                        res.render('my-article-reviews', {isLoggedIn: req.session.token, reviewCriteria: results, reviews: reviews});
                    }
                    else {
                        
                    }
                });
            }
            else{
                if (reviews.includes("Please log in again")) {
                    req.session.error = results;
                    req.session.token = null;
                    return res.redirect('/login');
                }
            }
        });
    }
});

app.get('/my-reviews', (req, res) => {
    if (req.session.token === null || req.session.token === undefined) {
        return res.redirect('/');
    }
    else {
        myApi.getUserReviews(req.session.token, req.session.userId, (reviews, status) => {
            if(status){
                myApi.getReviewCriteriaForUserReviews(req.session.token, (results, status) => {
                    if (status) {
                        res.render('my-reviews', {isLoggedIn: req.session.token, reviewCriteria: results, reviews: reviews});
                    }
                    else {
                        
                    }
                });
            }
            else{
                if (reviews.includes("Please log in again")) {
                    req.session.error = results;
                    req.session.token = null;
                    return res.redirect('/login');
                }
            }
        });
    }
});

app.use(function (req, res) {
    res.status(404);
    res.render('error')
    return
});
app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:` + port));