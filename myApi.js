const API_URL = "http://localhost:8080/api"
const axios = require('axios');
const FormData = require('form-data');
const web3 = require('web3');

exports.registerUser = async function (signupReq, f) {
  let res = await fetch(API_URL + "/auth/signup", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(signupReq)
  });
  if (res.ok) {
    res = await res.text()
    let status = true
    f(res, status)
  }
  else {
    res = await res.text();
    let status = false;
    f(res, status)
  }
}

exports.login = async function (loginReq, f) {
  let res = await fetch(API_URL + "/auth/signin", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(loginReq)
  });
  if (res.ok) {
    res = await res.json()
    let status = true
    f(res.token, status)
  }
  else {
    res = await res.text();
    let status = false
    f(res, status)
  }
}

function formatDate(dateTime) {
  dateTime = dateTime.split("T")[0]
  let date = new Date(dateTime)
  let options = { month: "short" };
  let formattedDate = date.toLocaleDateString("en-US", options) + " " + date.getDate() + ", " + date.getFullYear();
  return formattedDate;
}

exports.getArticles = async function (f) {
  let res = await fetch(API_URL + "/articles?payment_status=true", {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (res.ok) {
    res = await res.json()
    for (let article of res) {
      article.created_at = formatDate(article.created_at)
      formatTagNames(article.tagNames)
      // formatDescription(article)
    }
    f(res)
  }
  else {
    res = await res.text();
    f(res)
  }
}

function formatTagNames(tagNames) {
  for (let i in tagNames) {
    let shortTagName = ""
    tagNames[i] = tagNames[i].split(" ")
    for (let word of tagNames[i]) {
      shortTagName += word.charAt(0).toUpperCase()
    }
    tagNames[i] = shortTagName
  }
}

function formatDescription(article) {
  description = article.description.split(" ")
  if (description.length > 45) {
    description = description.slice(0, 45).join(" ");
  }
  article.description = description + " ..."
}

exports.getArticle = async function (id, f) {
  let res = await fetch(API_URL + "/articles/" + id, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (res.ok) {
    res = await res.json()
    res.created_at = formatDate(res.created_at);
    res.review_until = formatDate(res.review_until);
    f(res, true)
  }
  else {
    res = await res.text();
    f(res, false)
  }
}

exports.logout = async function (token, f) {
  let res = await fetch(API_URL + "/auth/logout", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  });
  if (res.ok) {
    res = await res.text()
    let status = true
    f(res, status)
  }
  else {
    if (res.status === 401) {
      f("Unauthorized", false)
    }
    if (res.status === 503) {
      let status = false;
      res = await res.text();
      f(res, status)
    }
  }
}

exports.getTagLevels = async function (token, f) {
  let res = await fetch(API_URL + "/tagLevels", {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  });
  if (res.ok) {
    res = await res.json()
    f(res.tagLevel)
  }
  else {
    res = await res.text();
    f(res)
  }
}

exports.addArticle = async function (articleReq, token, callback) {
  const formData = new FormData();
  formData.append('file', articleReq.file.buffer, articleReq.file.originalname);

  const addArticleDto = {
    title: articleReq.title,
    description: articleReq.description,
    authors: articleReq.authors,
    tagLevels: articleReq.tagLevels
  };
  formData.append('addArticleDto', JSON.stringify(addArticleDto));

  const headers = {
    'Authorization': 'Bearer ' + token,
    ...formData.getHeaders()
  };

  const config = {
    method: 'POST',
    url: API_URL + "/articles",
    headers: headers,
    data: formData
  };

  try {
    let res = await axios(config);
    callback(res.data, true);
  } catch (error) {
    if (error.response.status === 400) {
      callback("", false);
    }
    if (error.response.status === 401) {
      callback("Session expired! Please log in again!", false);
    }
    if (error.response.status === 404) {
      if (error.response.data.includes("user")) {
        callback("There is no account associated with the author " + error.response.data.split("user")[1] + "!", false);
      }
      else if (error.response.data.includes("Could not find tag")) {
        callback("The tag  " + error.response.data.split("tag")[1] + " does not exist!", false);
      }
      else if (error.response.data.includes("Could not find level")) {
        callback("The level  " + error.response.data.split("level")[1] + " does not exist!", false);
      }
      else {
        callback("The tag-level combination you entered is invalid. Please select a valid combination from the available options!", false);
      }
    }
    if (error.response.status === 422) {
      callback(error.response.data, false);
    }
  }
};

exports.getBadges = async function (token, callback) {
  let res = await fetch(API_URL + "/tags", {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  });
  if (res.ok) {
    res = await res.json();
    callback(res, true);
  }
  else {
    callback("Session expired! Please log in again!", false);
  }
}

exports.getTest = async function (token, id, callback) {
  let res = await fetch(API_URL + "/tags/" + id, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  });
  if (res.ok) {
    res = await res.json();
    callback(res, true);
  }
  else {
    if (res.status === 401) {
      callback("Session expired! Please log in again!", false);
    }
    res = await res.text();
    callback(res, false);
  }
}

exports.computeTestScore = async function (token, id, answerIds, callback) {
  let res = await fetch(API_URL + "/tags/" + id, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(answerIds)
  });
  if (res.ok) {
    res = await res.json();
    console.log(res);
    let status = true;
    callback(res, status);
  }
  else {
    if (res.status == 401) {
      callback("Session expired! Please log in again!", false);
    }
    else {
      res = await res.text();
      callback(res, false);
    }
  }
}