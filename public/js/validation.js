
function addAlert(message) {
    document.getElementById('alert-container').innerHTML = '' +
        '<div class="alert alert-danger alert-dismissible fade show mb-0" role="alert">' +
        '<strong>' + message + '</strong> ' +
        '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button> ' +
        '</div> ' +
        '';
}

function hasSpecialCharacters(fieldValue) {
    var regex = /^[a-zA-Z\s]+$/;
    return !regex.test(fieldValue);
}
function isInvalidEmail(fieldValue) {
    var regex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$/
    return !regex.test(fieldValue)
}

const registerForm = document.querySelector("#register-form");
if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
        const name = document.querySelector("input[name='name']").value;
        const email = document.querySelector("input[name='email']").value;
        const metamask_id = document.querySelector("input[name='metamask_id']").value;
        const password = document.querySelector("input[name='password']").value;

        let valid = true;
        let errorMessage = "";

        if (name.length <= 3 || name.length > 100) {
            valid = false;
            errorMessage = "Name must contain between 3 and 100 characters!";
        } else if (hasSpecialCharacters(name)) {
            valid = false;
            errorMessage = "Name must not contain special characters!";
        } else if (metamask_id.length != 42) {
            valid = false;
            errorMessage = "Metamask address is invalid!";
        } else if (isInvalidEmail(email)) {
            valid = false;
            errorMessage = "Email is invalid!";
        }
        else if (password.length < 8) {
            valid = false;
            errorMessage = "Password must contain at least 8 characters!";
        } else if (password.length > 20) {
            valid = false;
            errorMessage = "Password must contain less than 20 characters!";
        }

        if (!valid) {
            event.preventDefault();
            addAlert(errorMessage)
        }
    })
}

const loginForm = document.querySelector("#login-form");
if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        const email = document.querySelector("input[name='email']").value;

        let valid = true;
        let errorMessage = "";

        if (isInvalidEmail(email)) {
            valid = false;
            errorMessage = "Email is invalid!";
        }

        if (!valid) {
            event.preventDefault();
            addAlert(errorMessage)
        }
    });
}

function areInvalidAuthors(authors) {
    const regex = /^[\w\s]+(,[\w\s]+)*$/;
    const invalidRegex = /^[\s,]*$/;
    return !regex.test(authors) || invalidRegex.test(authors);
}


function isInvalidFileFormat(file) {
    const fileFormat = file.name.split(".").pop().toLowerCase();
    return fileFormat !== "pdf";
}

function sameTagsDifferentLevels(tags) {
    const tagMap = {};
    for (const tag of tags) {
        const word = tag.slice(0, tag.indexOf(':'));
        if (tagMap[word]) {
            return true;
        }
        tagMap[word] = true;
    }
    return false;
}


const addArticleForm = document.querySelector("#add-article-form");
if (addArticleForm) {
    addArticleForm.addEventListener("submit", function (event) {
        const title = document.querySelector("input[name='title']").value;
        const description = document.querySelector("textarea[name='description']").value;
        const authors = document.querySelector("input[name='authors']").value;
        const fileInput = document.querySelector('#file');
        const file = fileInput.files[0];
        const tagSelect = document.querySelector('#tags');
        const tags = Array.from(tagSelect.selectedOptions).map(option => option.value);

        let valid = true;
        let errorMessage = "";
        if (title.length === 0) {
            valid = false;
            errorMessage = "Title is required!";
        }

        if (description.length === 0) {
            valid = false;
            errorMessage = "Description is required!";
        }

        if (authors.length > 0 && areInvalidAuthors(authors)) {
            valid = false;
            errorMessage = "Coauthors field is not properly formatted!";
        }

        if (isInvalidFileFormat(file)) {
            valid = false;
            errorMessage = "Article file should be .pdf!";
        } else if (file.size > 10000000) {
            valid = false;
            errorMessage = "Article file should not exceed 10MB in size!";
        }

        if (tags.length > 3) {
            valid = false;
            errorMessage = "Maximum number of tags is 3!";
        } else if (tags.length === 0) {
            valid = false;
            errorMessage = "There must be at least one selected tag!";
        } else if (sameTagsDifferentLevels(tags)) {
            valid = false;
            errorMessage = " Multiple difficulty levels assigned to the same tag. Please ensure each tag has only one assigned difficulty level!";
        }

        if (!valid) {
            event.preventDefault();
            addAlert(errorMessage);
        }
    });
}

{/* <section id="particles-js" class="bg-secondary py-lg-5 position-relative">
  <div class="container particles-layout">
    <div class="row">
      <div class="col-lg-12">
        <h1 class="display-4 fst-italic">Add an article</h1>
        <hr class="hero-divider" />
        <h2 class="fst-italic">In exchange for the reviews you will be receiving, we ask you to pay 0.1 ethereum for
          every added article. Upload a PDF of your article, prepare a short description for it and decide on the most
          important skills that a reviewer must have to review your paper. After that, you're all set.</h2>
      </div>
    </div>
  </div>
</section>

<section class="py-5">
  <div class="container">
    <div class="row">
      <div class="col-md-8 mx-auto">
        <form action="/add-article" method="POST" enctype="multipart/form-data" id="add-article-form">
          <!-- <div class="form-floating mb-3">
            <input type="text" class="form-control" id="title" name="title" required placeholder="Title">
            <label for="title">Title</label>
          </div> -->
          <div class="mb-3">
            <label for="title">Title</label>
            <input type="text" class="form-control" id="title" name="title" placeholder="Title of the article" required>
          </div>
          <div class="mb-3">
            <label for="description">Description</label>
            <textarea class="form-control" id="description" name="description"
              placeholder="Description/Abstract of the article" required></textarea>
          </div>
          <div class="mb-3">
            <label for="authors">Coauthors</label>
            <input type="text" class="form-control" id="authors" name="authors"
              placeholder="Second author, third author, ...">
          </div>
          <div class="mb-3">
            <label for="tags" class="form-label">Tags</label>
            <select id="tags" name="tags[]" multiple>
              <option value=""></option>
              <% for (let i in tagLevels){ %>
                <option value="<%=tagLevels[i].first + " : " + tagLevels[i].second %>">
                  <%=tagLevels[i].first + " - " + tagLevels[i].second %>
                </option>
                <% } %>
            </select>
          </div>
          <div class="mb-3">
            <label for="file" class="form-label">Article File</label>
            <input type="file" class="form-control" id="file" name="file" accept=".pdf" required>
          </div>
          <button type="submit" class="btn btn-warning">Add Article</button>
        </form>
      </div>
    </div>
  </div>
</section>
<link rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/selectize.js/0.15.2/css/selectize.bootstrap5.min.css"
  integrity="sha512-Ars0BmSwpsUJnWMw+KoUKGKunT7+T8NGK0ORRKj+HT8naZzLSIQoOSIIM3oyaJljgLxFi0xImI5oZkAWEFARSA=="
  crossorigin="anonymous" referrerpolicy="no-referrer" />
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/selectize.js/0.15.2/js/selectize.min.js"
  integrity="sha512-IOebNkvA/HZjMM7MxL0NYeLYEalloZ8ckak+NDtOViP7oiYzG5vn6WVXyrJDiJPhl4yRdmNAG49iuLmhkUdVsQ=="
  crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script type="module" src="/js/selectize.js"></script> */}