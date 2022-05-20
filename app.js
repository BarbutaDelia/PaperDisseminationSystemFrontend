const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const cookieParser=require('cookie-parser');
const session = require('express-session');
const sqlite3 = require('sqlite3');

// app.use(session({secret: 'ssshhhhh'}));
var sess;
var databaseNrEntries;
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
app.use(session({secret: 'ssshhhhh'}))

// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res

app.get('/', (req, res) => {
    let db = new sqlite3.Database('./cumparaturi.db', (err) => {
        if(err) {
            return console.log(err.message);
        }
        // console.log("Conectare reusita!")
    });
    db.all(`SELECT * FROM produse`, (err, data) => {
        if(err) {
            return console.log(err.message); 
        }
        // console.log(data);
        databaseNrEntries = data.length
        // console.log(databaseNrEntries)
        res.render('index', {u: req.session.username, data: data})
    })
})
    
const fs = require('fs');   
const { redirect } = require('express/lib/response');
const { ClientRequest } = require('http');
// let rawdata = fs.readFileSync('intrebari.json');
// let intrebari = JSON.parse(rawdata);
fs.readFile('intrebari.json', (err, data) => {
    if (err) throw err;
    let intrebari = JSON.parse(data);
    app.get('/chestionar', (req, res) => {
        // în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care conține vectorul de întrebări
        res.render('chestionar', {intrebari: intrebari});
    });
    
    app.post('/rezultat-chestionar', (req, res) => {
        console.log(req.body);
        //res.send("formular: " + JSON.stringify(req.body)
        var punctaj = 0
        for(let i in intrebari){
            if(req.body[`q${i}`] == intrebari[i].corect)
                punctaj++;
        }
        res.render('rezultat-chestionar', {punctaj: punctaj});
        console.log(punctaj)
    }); 
});
app.get('/autentificare', (req, res) => {
    // res.clearCookie("mesajEroare")
    // if(req.cookies.utilizator == null)index
    //     res.render('autentificare', {m: req.cookies.mesajEroare})
    // res.redirect('/')
    sess = req.session;
    if(sess.username != null){
        res.redirect('/')
    }
    else{
        res.render('autentificare', {e: req.session.errorMsg})
    }
})
let rawdata = fs.readFileSync('utilizatori.json');
let utilizatori = JSON.parse(rawdata);

app.post('/verificare-autentificare', (request, response) => {
    console.log(utilizatori)
    let username = request.body.username;
	let password = request.body.password;
    for(let i in utilizatori){
        if(username == utilizatori[i].utilizator && password == utilizatori[i].parola){
            sess=request.session;
            sess.username = username;
            sess.lastName = utilizatori[i].nume;
            sess.firstName = utilizatori[i].prenume;
            // response.cookie('utilizator', 'delia')
            response.redirect('/')
            return //de ce fara asta imi executa codul de dupa redirect??
        }
    }
    sess = request.session
    sess.errorMsg = "Utilizator sau parola gresite!"
    // response.cookie('mesajEroare', 'Utilizator sau parola gresite!')
    response.redirect('/autentificare')
    

});
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.redirect('/');
    });
})
app.get('/creare-bd', (req, res) => {
    new sqlite3.Database('./cumparaturi.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err && err.code == "SQLITE_CANTOPEN") {
            createDatabase();
        } 
        else if (err) {
            console.log(err);
            exit(1);
        }
        res.redirect('/');
    });
})
function createDatabase() {
    var newdb = new sqlite3.Database('cumparaturi.db', (err) => {
        if (err) {
            console.log(err);
            exit(1);
        }
        console.log("Baza de date creata!")
        createTables(newdb);
    });
}
function createTables(newdb) {
    newdb.run("CREATE TABLE produse (id_produs PRIMARY KEY NOT NULL, nume_produs TEXT NOT NULL UNIQUE, pret REAL NOT NULL)", function(createResult){
        if(createResult) 
            throw createResult;
    });
    console.log("Tabela creata!")
}
app.get('/inserare-bd', (req, res) => {
    let db = new sqlite3.Database('./cumparaturi.db', (err) => {
        if(err) {
            return console.log(err.message);
        }
        console.log("Conectare reusita!")
    });
    db.run(`INSERT INTO produse(id_produs, nume_produs, pret) VALUES (1, 'Seminte de dovleac', 20.5), (2, 'Unt de arahide', 21.5), 
    (3, 'Lapte de cocos', 49.63), (4, 'Fulgi de ovaz', 15), (5, 'Baton cu nuca', 9.7)`, (err) => {
        if(err) {
            return console.log(err.message); 
        }
        console.log('Adaugarea s-a realizat cu succes!');
    })
    res.redirect('/');
})
app.post('/adaugare-cos', (request, response) => {
    let id = request.body.id
    sess = request.session
    sess.productArray = sess.productArray || []; 
    sess.productArray.push(id)
    console.log(sess.productArray)
    response.redirect('/')
});
app.get('/vizualizare-cos', (request, response) => {
    console.log(databaseNrEntries)
    var productsId
    var numberOfProducts = []
    for(let i = 0; i < databaseNrEntries; i++){
        numberOfProducts[i] = 0
    }
    // console.log(numberOfProducts)
    let db = new sqlite3.Database('./cumparaturi.db', (err) => {
        if(err) {
            return console.log(err.message);
        }
    });
    for(i in request.session.productArray)
    {
        if(i == 0){
            productsId = request.session.productArray[i]
        }
        if(i > 0 && i < request.session.productArray.length ){
            productsId += " OR id_produs = " + request.session.productArray[i]
        }
        numberOfProducts[request.session.productArray[i] - 1] ++;
    }
    // console.log(productsId)
    // console.log(numberOfProducts)
    db.all(`SELECT * FROM produse WHERE id_produs = ` + productsId, (err, data) => {
        if(err) {
             return console.log(err.message); 
        }
        response.render('vizualizare-cos', {productArray: data, numberOfProducts: numberOfProducts})
        // console.log(data)
    })
    // }
    // response.render('vizualizare-cos', {productArray: productsId})
});
// con
// const listaIntrebari = [
//     {
//         intrebare: 'Când au devenit alimentele bio cunoscute?', 
//         variante: ['1900', '1940', '1960', '1970'],
//         corect: 1
//     },
//     {
//         intrebare: 'Se pot utiliza pesticide în producția alimentelor bio?',
//         variante: ['Nu', 'Da, dacă acestea nu sunt sintetice', 'Da'],
//         corect: 1
//     },
//     {
//         intrebare: 'Ce reprezintă efectul Halo?',
//         variante: ['Efectul de luminare a unei suprafețe', 'Tendința unei persoane de a consumă alimente pe care le-a cunoaște dintr-un context anterior', 'Efectul prin care percepția unei persoane este afectată de credințele sale'],
//         corect: 2
//     }

// ];

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));