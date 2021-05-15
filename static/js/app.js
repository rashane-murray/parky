/* Add your Application JavaScript */
// Instantiate our main Vue Instance
const app = Vue.createApp({
    
    
    data() {
    },
    methods: {
        
    }
});



app.component('app-header', {

    
    name: 'AppHeader',
    template: `
            <!DOCTYPE html>
            <html>
                <head>
                    
                    <title>
                    
                    </title>
                    <!--
                    {% block css %}
                    -->
                    
                    <link rel = 'stylesheet' href= '../static/css/base.css'/>
                    <link rel = 'stylesheet' href= '../static/css/bootstrap.css'/>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
                    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
                    <!--
                    {% end block %}
                    -->
                </head>
                <body>
                    <!--
                    {% block main %}
                    
                    -->
                    
                    <div id = "navbar">
                        <header>
                            <i id = "car" class = "fa fa-car"></i>
                            <span id = "business-name" class = "navbar-text">Parky</span>
                            <span class = "nav-item logged-in"><a href = "/cars/new">Add Car</a></span>
                            <span class = "nav-item logged-in"><a href = "/explore">View Cars</a></span>
                            <span class = "nav-item logged-in"><a href = "/users/{user_id}">My Profile</a></span>
                            <span class = "account-ctrls logged-out" id = "/login"><a href = "/login">Login</a></span>
                            <span class = "account-ctrls logged-out" id = "/register"><a href = "/register">Register</a></span>
                            <span @click = "logout" class = "account-ctrls logged-in" id = "/logout"><a href = "/auth/logout">Logout</a></span>
                        </header>    
                    </div>
                    
    
    `,
    /*
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top">
      <a class="navbar-brand" href="#">Project 2</a>
      <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
    
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item active">
            <router-link class="nav-link" to="/">Home <span class="sr-only">(current)</span></router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/cars/new">Add Car<span class="sr-only">(current)</span></router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/explore">View Cars<span class="sr-only">(current)</span></router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/users/{user_id}">My Profile<span class="sr-only">(current)</span></router-link>
          </li>
        </ul>
      </div>
    </nav>
    */
    methods: {
        logout(){
            fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                    'X-CSRFToken': token
                },
                credentials: 'same-origin'
            })
            .then(function (response) {
                return response.json();
            })
            .then(function (response) {
                window.location.href = "/login/"
            })
        }
    }
});

app.component('app-footer', {
    name: 'AppFooter',
    template: `
    <footer>
        <div class="fixed-bottom">
            <p>Copyright &copy; {{ year }} Flask Inc.</p>
        </div>
    </footer>
    `,
    data() {
        return {
            year: (new Date).getFullYear()
        }
    }
});


const LoginForm = {
    template: `
            <link rel = "stylesheet" href = "../static/css/login.css" type = "text/css"/>
            <main>
                <div id = "background">
                    <br>
                    <br>
                    
                    <h2 class = "form-title"><strong>Login to Your Account</strong></h2>
                    
                    <div id = "log-form-area">
                        <br>
                        <form id="loginForm" @submit.prevent="login" method = "POST" enctype="multipart/form-data">
                            
                            
                            <label class = "form-input-label ">Username</label>
                            <br>
                            <input type = "text" id = "username" name = "username" placeholder = "Username" class = "form-input"/>
                            <br>

                            <label class = "form-input-label ">Password</label>
                            <br>
                            <input type = "password" id = "password" name = "password" placeholder = "Password" class = "form-input"/>
                            <br>
                            <br>
                            <input class = "form-input save-btn" type = "submit" value = "Login"/>
                        </form>
                        
                    </div>
                    <br>
                    <br>
                    <br>
                </div>
            </main>
            <!--
            {% end block %}
            -->
        </body>
    </html>
    `,
    methods: {
        login() {
            let self = this;
            let loginForm = document.getElementById('loginForm');
            let form_data = new FormData(loginForm)

            fetch("/api/auth/login", {
                method: 'POST',
                body: form_data,
                headers: {
                    'X-CSRFToken': token
                },
                credentials: 'same-origin'
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (response) {
                    let jwt_token = response.token;
                    let user_id = response.user_id;

                    // We store this token in localStorage so that subsequent API requests
                    // can use the token until it expires or is deleted.
                    localStorage.setItem("token", jwt_token);
                    localStorage.setItem("user_id", user_id);
                    console.info("Token generated and added to localStorage.");
                    self.token = jwt_token;
                    
                    console.log(response);
                    if(response['message'] == "Login Successful")
                    {
                        window.location.href = "/users/" + response['user_id']
                    }
                    else{
                        console.log("i forgot my password :(")
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
        }
    }
};

const RegisterForm = {
    template: `
            <link rel = "stylesheet" href = "../static/css/register.css" type = "text/css"/>
            <main>
                <div id = "background">
                    <br>
                    <br>
                    
                    <h1><strong>Register New User</strong></h1>
                    
                    <div id = "reg-form-area">
                        <br>
                        <form id="registerForm" @submit.prevent="register" method = "POST" enctype="multipart/form-data">
                            
                            
                            <label class = "form-input-label half">Username</label>
                            <label class = "form-input-label half">Password</label>
                            <br>
                            <input type = "text" id = "username" name = "username" placeholder = "Username" class = "form-input half"/>
                            <input type = "password" id = "password" name = "password" placeholder = "Password" class = "form-input half"/>
                            <br>
                            <br>

                            <label class = "form-input-label half">Fullname</label>
                            <label class = "form-input-label half">Email</label>
                            <br>
                            <input type = "text" id = "name" name = "name" placeholder = "Full Name" class = "form-input half"/>
                            <input type = "text" id = "email" name = "email" placeholder = "Email" class = "form-input half"/>
                            <br>
                            <br>

                            <label class = "form-input-label half">Location</label>
                            
                            <br>
                            <input type = "text" id = "location" name = "location" placeholder = "Location" class = "form-input half"/>
                            
                            <br>
                            <br>
                            
                            <br>
                            <label class = "form-input-label">Bio</label>
                            <br>
                            <textarea class = "form-input" name = "biography" id = "biography" placeholder="Biography..." rows="10" cols = "100"></textarea>
                            <br>
            
                            <label class = "form-input-label">Upload Photo</label>
                            <br>
                            <input type = "file" id = "photo" name = "photo" class = "form-input"/>
                            <br>
                            <br>
                            <input class = "form-input save-btn" type = "submit" value = "Register"/>
                        </form>
                        
                    </div>
                    <br>
                    <br>
                    <br>
                </div>
            </main>
            <!--
            
            -->
        </body>
    </html>
    `,
    methods: {
        register() {
            let self = this;
            let registerForm = document.getElementById('registerForm');
            let form_data = new FormData(registerForm)
            console.log(token);

            fetch("/api/register", {
                method: 'POST',
                body: form_data,
                headers: {
                    'X-CSRFToken': token
                },
                credentials: 'same-origin'
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (jsonResponse) {
                    //display a success message
                    self.errors = jsonResponse.errors;
                    console.log(jsonResponse);
                    if(jsonResponse['message'] == "User regristration Successful")
                    {
                        window.location.href = "/login"
                    }
                    else{
                        console.log("i forgot my password :(")
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
        }
    }
};

const CarForm = {
    template: `
    
    <!--<form method="post" enctype ="multipart/form-data" id = "carForm"  @submit.prevent="uploadCar">

    
        <div class="form-row">
            <div class="form-group col-md-6">
                <label for="make">Make</label>
                <input type="text" id="make" name="make">
            </div>
            <div class="form-group col-md-6">
                <label for="model">Model</label>
                <input type="text" id="model" name="model">
            </div>    
        </div>
        <br>
        <div class="form-row">
            <div class="form-group col-md-6">
                <label for="colour">Colour</label>
                <input type="text" id="colour" name="colour">
            </div>
            <div class="form-group col-md-6">
                <label for="year">Year</label>
                <input type="text" id="year" name="year">
            </div>
        </div>
        <br>
        <div class="form-row">
            <div class="form-group col-md-6">
                <label for="price">Price</label>
                <input type="text" id="price" name="price">
            </div>
            <div class="form-group col-md-6">
                <label for="car_type">Car Type</label>
                <select id="car_type" name="car_type">
                    <option value="SUV">SUV</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Truck">Truck</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Minivan">Minivan</option>
                    <option value="Pickup">Pickup</option>
                </select>
            </div>
        </div>
        <br>
        <div class="form-group">
            <label for="transmission">Transmission</label>
            <select id="transmission" name="transmission">
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
            </select>
        </div>
        <br>
        <div class="form-group">
            <label for="description">Description</label>
            <br>
            <textarea class="form-control" name="description"></textarea>
        </div>
        <br>
        <div class="form-group">
            <label for="photo">Upload Photo</label>
            <br>            
            <input type="file" name="photo" class="form-control">
        </div>
        <br>
        <button class="submit" type="submit">Submit</button type="submit" class="btn btn-primary" >
     </form> -->
            <link rel = "stylesheet" href = "../static/css/new_car.css" type = "text/css"/>
            <main>
                <div id = "background">
                    <br>
                    <br>
                    <!--{% for fieldName, errorMessages in form.errors.items(): %}
                        {% for err in errorMessages: %}
                            {{ err }}
                        {% endfor %}
                    {% endfor %}-->
                    <h1><strong>Add New Car</strong></h1>
                    
                    <div id = "car-form-area">
                        <br>
                        <form id="carForm" @submit.prevent="uploadCar" method = "POST" enctype="multipart/form-data">
                            <!-- {{ form.csrf_token  }} -->
                            
                            <label class = "form-input-label half">Make</label>
                            <label class = "form-input-label half">Model</label>
                            <br>
                            <input type = "text" id = "make" name = "make" placeholder = "Make" class = "form-input half"/>
                            <input type = "text" id = "model" name = "model" placeholder = "Model" class = "form-input half"/>
                            <br>
                            <br>

                            <label class = "form-input-label half">Colour</label>
                            <label class = "form-input-label half">Year</label>
                            <br>
                            <input type = "text" id = "colour" name = "colour" placeholder = "Colour" class = "form-input half"/>
                            <input type = "text" id = "year" name = "year" placeholder = "Year" class = "form-input half"/>
                            <br>
                            <br>

                            <label class = "form-input-label half">Price</label>
                            <label class = "form-input-label half">Type</label>
                            <br>
                            <input type = "text" id = "price" name = "price" placeholder = "Price" class = "form-input half"/>
                            <select name = "car_type" id = "car_type" class = "form-input half">
                                <option value="SUV">SUV</option>
                                <option value="Sedan">Sedan</option>
                                <option value="Truck">Truck</option>
                                <option value="Hatchback">Hatchback</option>
                                <option value="Minivan">Minivan</option>
                                <option value="Pickup">Pickup</option>
                            </select>
                            <br>
                            <br>
                            <br>
                            
                            <label class = "form-input-label half">Transmission</label>
                            <br>
                            <select name = "transmission" id = "transmission" class = "form-input half">
                                <option value = "Automatic">Automatic</option>
                                <option value = "Manual">Manual</option>
                            </select>
                            <br>
                            <br>
                            <label class = "form-input-label">Description</label>
                            <br>
                            <textarea class = "form-input" name = "description" id = "description" placeholder="Description..." rows="10" cols = "100"></textarea>
                            <br>
            
                            <label class = "form-input-label">Upload Photo</label>
                            <br>
                            <input type = "file" id = "photo" name = "photo" class = "form-input"/>
                            <br>
                            <br>
                            <input class = "form-input save-btn" type = "submit" value = "Add Car"/>
                        </form>
                        
                    </div>
                    <br>
                    <br>
                    <br>
                </div>
            </main>
            
            <!--
            {% end block %}
            -->
        </body>
    </html>
    `,
    methods: {
        uploadCar() {
            let self = this;
            let carForm = document.getElementById('carForm');
            let form_data = new FormData(carForm);

            fetch("/api/cars", {
                method: 'POST',
                body: form_data,
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token"),
                    'X-CSRFToken': token
                },
                credentials: 'same-origin'
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (jsonResponse) {
                    //display a success message
                    console.log(jsonResponse);
                    self.errors = jsonResponse.errors;
                    window.location.href = "/users/" +jsonResponse['user_id'];
                })
                .catch(function (error) {
                    console.log(error);
                });
        }
    }
};

const ViewCar = {
    name: 'ViewCar',
    template: `<!--<div class="carDiv">
            <h2>This Car</h2>
            <div>
            <img v-bind:src=getImgUrl(car_data.photo)>
            <p> Year: {{ car_data.year }} </p> <p> Manufacturer: {{ car_data.make }} </p>
            <p> Model: {{ car_data.model }} </p>
            <p> Description: {{ car_data.description }} </p>
            <p> Price: {{ car_data.price }} </p>
            <p> Type: {{ car_data.car_type }} </p>
            <p> Colour: {{ car_data.colour }} </p>
 
            <button @click="addFavourite" >Add to Favourite</button>
            <button>Email Owner</button>
 
            </div>
            
        </div>-->
                <link rel = 'stylesheet' href= '../static/css/details.css'/>
                <div id = "car-card">
                    <div id="car-detail-image">
                        <img v-bind:src=getImgUrl(car_data.photo) class = "car-picture"/>
                    </div>
                    <div id = "car-detail">
                        <h2 id = "car-year">{{ car_data.year }} {{ car_data.make }}</h2>
                        <h3 id = "car-model">{{ car_data.model }}</h3>
                    
                    
                    
                        <p id = "description">
                            {{ car_data.description }}
                        </p>
                        <br>
                        <div id = "car-values">
                            <span class = "car-info">
                                <span class = "detail-title">Color</span>
                                <span class = "detail-value">{{car_data.colour}}</span>
                            </span>
                            <span class = "car-info">
                                <span class = "detail-title">Body Type</span>
                                <span class = "detail-value">{{car_data.car_type}}</span>
                            </span>
                            <span class = "car-info">
                                <span class = "detail-title">Price</span>
                                <span class = "detail-value">$ {{car_data.price}}</span>
                            </span>
                            <span class = "car-info">
                                <span class = "detail-title">Transmission</span>
                                <span class = "detail-value">{{car_data.transmission}}</span>
                            </span>
                        </div>
                        <br>
                        <span>
                            <button id = "email-owner">Email Owner</button>
                            <button id = "add-favourite" @click="addFavourite"><i id = "heart" class = "fa fa-heart-o" ></i></button>
                            
                        </span>
                    </div>
                    <br>
                    
                        
                        
                    
                </div>
                <!--
                {% end block %}
                -->
            </body>
        </html>`,
        created() {
            let self = this;
     
            let id = this.$route.query.uid
     
            fetch('/api/cars/' + String(id),
                {
                    method: 'GET',
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    console.log(data);
                    self.car_data = data;
                })
        },
        data() {
            return {
                car_data: []
            }
        },
        methods: {
            addFavourite() {
                let self = this;
                let heart = document.getElementById("heart")
                let id = this.$route.query.uid
                if(heart.classList.contains("fa-heart-o"))
                {
                    heart.classList.remove("fa-heart-o");
                    heart.classList.add("fa-heart");
                    fetch('/api/cars/'+ (id) +'/favourite', {
                        method: 'POST',
                        headers: {
                            Authorization: "Bearer " + localStorage.getItem("token"),
                            'X-CSRFToken': token
                        }
                    })
                        .then(function (response) {
                            return response.json();
                        })
                        .then(function (data) {
                            console.log(data);
                            self.articles = data.articles;
                        })
                }
                else
                {
                    this.removeFavourite()
                }
                
                console.log(id)
                // console.log("hello")
                
                
            },

            removeFavourite() {
                let self = this;
                let id = this.$route.query.uid
                let heart = document.getElementById("heart")
                heart.classList.remove("fa-heart");
                heart.classList.add("fa-heart-o");
                console.log(id)
                // console.log("hello")
                
                fetch('/api/cars/'+ (id) +'/remove_favourite', {
                    method: 'POST',
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                        'X-CSRFToken': token
                    }
                })
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (data) {
                        console.log(data);
                        self.articles = data.articles;
                    })
            },
     
            getImgUrl(pic) {
                return '../static/car_uploads/'+ pic;
            }
        }
};
    
const ViewUser = {
    name: 'ViewUser',
    
    template: `<!--<div class="userDiv">
            <h2>User: {{ user_data.username }}</h2>
            <div>
            <img v-bind:src=getImgUrl(user_data.photo)>
            <p> Name: {{ user_data.name }} </p>
            <p> Bio: {{ user_data.biography }} </p>
            <p> Email: {{ user_data.email }} </p>
            <p> Location: {{ user_data.location }} </p>
            <p> Joined: {{ user_data.date_joined }} </p>
            </div>
            
        </div>-->
        
                <title>Profile: {{user_data.username}} </title>
                <link rel = 'stylesheet' href= '../static/css/profile.css'/>
                <div id = "information">
                    <div id = "profile-card">
                        <br>
                        <div class = 'profile-picture'>
                            <img v-bind:src=getImgUrl(user_data.photo) class = "user-picture"/>
                        </div>
                        <div class = "profile-info">
                            <span class = "user-name"><h2>{{ user_data.name }}</h2></span>
                            <span class = "user-tag"><h3>@{{ user_data.username }}</h3></span>

                            <span class = "user-details">
                                <span class = "detail-title">Bio</span>
                                <p class = "user-bio detail-value">
                                    {{ user_data.biography }}
                                </p>
                            </span>

                            

                            <br>
                            <div id = "user-info">
                                <span class = "user-details">
                                    <span class = "detail-title">Email</span>
                                    <span class = "detail-value">{{ user_data.email }}</span>
                                </span>
                                <br>
                                <br>
                                <span class = "user-details">
                                    <span class = "detail-title">Location</span>
                                    <span class = "detail-value">{{ user_data.location }}</span>
                                </span>
                                <br>
                                <br>
                                <span class = "user-details">
                                    <span class = "detail-title">Joined</span>
                                    <span class = "detail-value">{{ user_data.date_joined }}</span>
                                </span>
                            </div>
                            <br>
                            <br>
                            <br>
                        </div>
                        
                    </div>
                    <br>
                    <h2>Cars Favourited</h2>
                    <div id = "cars-list">
                        <!--
                            {$ for car in favourites %}
                                <div class = "car-card">
                                    <img src = "{{url_for('static',filename = 'images/{{car.media_addr}}')}}"/>
                                    <span class = "car-year-make">
                                        {{ car.year }}
                                        
                                        {{ car.make }}
                                    </span>
                                    <span class = "car-price">
                                        <i class = "fa fa-tag"></i> {{ car.price }}
                                    </span>
                                    <span class = "car-model">
                                        {{ car.model }}
                                    </span>
                                    <br>
                                    <br>
                                    <button class = "view-details" onclick="window.location.href='details/{{ car.id }}';"></button>
                                </div>
                            {% end for %}-->
                            
                            <div v-if=" num_fave>0">
                                <ul >
                                    <li v-for="car in favourites" class = "car-card">
                                        <img v-bind:src=getCarImgUrl(car.photo)>
                                        <span class = "car-year-make">
                                            {{ car.year }}
                                            
                                            {{ car.make }}
                                        </span>
                                        <span class = "car-price">
                                            <i class = "fa fa-tag"></i> {{ car.price }}
                                        </span>
                                        <span class = "car-model">
                                            {{ car.model }}
                                        </span>
                                        <br>
                                        <br>
                                        <button class = "view-details" @click=getCar(car.id) >View Details</button>
                                    </li>
                                </ul>
                            </div>
                            <div v-else>
                                <p>
                                    This user has not favourited any cars.
                                    
                                </p>
                            </div>
                    </div>
                </div> 
                        
                          
                <!--
                {% end block %}
                -->
            </body>
        </html>
        `,
        
        created() {
            let self = this;
           
            
            fetch('/api/users/' + self.user_id,
                {
                    method: 'GET',
                    headers: {
                    Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                })
                .then(function (response) {
                
                    return response.json();
                })
                .then(function (data) {
                    console.log(data)
                    
                    self.user_data = data;
                   
                })
                .catch(function (error) {
                    console.log(error);
                });
            
            fetch('/api/cars/' + self.user_id + '/favourites',
                {
                    method: 'GET',
                    headers: {
                    Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                })
                .then(function (response) {
                    
                    return response.json();
                })
                .then(function (data) {
                    console.log(data)
                    self.num_fave = data['num_fave']
                    self.favourites = data['favourites']
                    console.log(self.num_fave)
                    console.log(self.favourites)
                    
                })
                .catch(function (error) {
                    console.log(error);
                });
        },
        data() {
     
            return {
                user_data: [],
                favourites: [],
                user_id: localStorage.getItem("user_id"),
                num_fave:[],
                
            }
        },
        methods: {
            getImgUrl(pic) {
                return '../static/uploads/'+ pic;
            },
     
            getCarImgUrl(pic) {
                return '../static/car_uploads/'+ pic;
            },
     
            getCar(cid){
                this.$router.push({path:'/cars/' + cid, query: {uid:cid}})
            }
     
                
            
        }
    };
    
const ViewCars = {
    name: 'ViewCars',
    template: `
        <!--<div class="carsDiv">
                <div v-for="car in cars" >
                    
                    <img v-bind:src=getImgUrl(car.photo)>
                    <p> Year: {{ car.year }} </p> <p> Manufacturer: {{ car.make }} </p>
                    <p> Model: {{ car.model }} </p>
                    <p> Description: {{ car.description }} </p>
                    <p> Price: {{ car.price }} </p>
                    <p> Type: {{ car.car_type }} </p>
                    <p> Colour: {{ car.colour }} </p>
                    <button @click=getCar(car.id)>See Details</button>
                </div> 
        </div>-->
        <link rel = 'stylesheet' href= '../static/css/explore.css'/>
        <div id = "information">
            <h2>Explore</h2>
            <div id = "explore-card">
                <br>
                
                <div class = "profile-info">
                    <form id = "search-form" @submit.prevent = "searchCar" method = "POST" >
                        <label class = "form-input-label half">Make</label>
                        <label id = "model-label" class = "form-input-label half">Model</label>
                        <br>
                        <input type = "text" name = "make" id = "make" placeholder = "Make"  class = "explore form-input third"/>
                        <input type = "text" name = "model" id = "model" placeholder = "Model"  class = "explore  form-input third"/>
                        <button type = "submit" value = "Search"  class = "explore search-btn form-input third"><i class = "fa fa-search"></i>Search</button>
                    </form>
                </div>
                
            </div>
            <br>
            <div id = "cars-list">
            <ul>
                <li v-for="car in cars" class = "car-card">
                    <img v-bind:src=getCarImgUrl(car.photo)>
                    <span class = "car-year-make">
                        {{ car.year }}
                        
                        {{ car.make }}
                    </span>
                    <span class = "car-price">
                        <i class = "fa fa-tag"></i> {{ car.price }}
                    </span>
                    <span class = "car-model">
                        {{ car.model }}
                    </span>
                    <br>
                    <br>
                    <button class = "view-details" @click=getCar(car.id) >View Details</button>
                </li>
            </ul>
            </div>
        </div>   
        <!--
        {% end block %}
        -->
            </body>
        </html>
        `,
    created() {
        let self = this;
 
        fetch('/api/cars',
            {
                
                method: 'GET',
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token"),
                }
            })
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                console.log(data);
                self.cars = data.carlist;
                console.log(self.cars)
            })
            
    },
    data() {
        return {
            cars: []
        }
    },
    methods: {
        getImgUrl(pic) {
            return '../static/uploads/'+ pic;
        },

        getCarImgUrl(pic) {
            return '../static/car_uploads/'+ pic;
        },
 
        getCar(id){
            this.$router.push({path:'/cars/' + id, query: {uid:id}})
        },

        /*
            uploadCar() {
            let self = this;
            let carForm = document.getElementById('carForm');
            let form_data = new FormData(carForm);

            fetch("/api/cars", {
                method: 'POST',
                body: form_data,
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token"),
                    'X-CSRFToken': token
                },
                credentials: 'same-origin'
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (jsonResponse) {
                    //display a success message
                    console.log(jsonResponse);
                    self.errors = jsonResponse.errors;
                    window.location.href = "/users/" +jsonResponse['user_id'];
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        */
        searchCar(){
            let form = document.getElementById('search-form');
            let form_data = new FormData(form);
            
            
            console.log("HI");
            fetch("/api/search", {
                
                method: 'POST',
                body: form_data,
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token"),
                    'X-CSRFToken': token
                },
                credentials: 'same-origin'
                
            })
            .then(function (response) {
                return response.json();
            })
            .then(function (jsonResponse) {
                //display a success message
                console.log(jsonResponse);
                self.errors = jsonResponse.errors;
                window.location.href = "/search/" ;
            })
            .catch(function (error) {
                console.log(error);
            });
        }
    }
};

const SearchResults = {
    name: 'SearchResults',
    template: `
        <!--<div class="carsDiv">
                <div v-for="car in cars" >
                    
                    <img v-bind:src=getImgUrl(car.photo)>
                    <p> Year: {{ car.year }} </p> <p> Manufacturer: {{ car.make }} </p>
                    <p> Model: {{ car.model }} </p>
                    <p> Description: {{ car.description }} </p>
                    <p> Price: {{ car.price }} </p>
                    <p> Type: {{ car.car_type }} </p>
                    <p> Colour: {{ car.colour }} </p>
                    <button @click=getCar(car.id)>See Details</button>
                </div> 
        </div>-->
        <link rel = 'stylesheet' href= '../static/css/explore.css'/>
        <div id = "information">
            <h2>SearchResults</h2>
            <div id = "explore-card">
                <br>
                
                <div class = "profile-info">
                    <form id = "search-form">
                        <label class = "form-input-label half">Make</label>
                        <label id = "model-label" class = "form-input-label half">Model</label>
                        <br>
                        <input type = "text" placeholder = "Make"  class = "explore form-input third"/>
                        <input type = "text" placeholder = "Model"  class = "explore  form-input third"/>
                        <button type = "submit" value = "Search" class = "explore search-btn form-input third"><i class = "fa fa-search"></i>Search</button>
                    </form>
                </div>
                
            </div>
            <br>
            <div id = "cars-list">
            <ul>
                <li v-for="car in results" class = "car-card">
                    <img v-bind:src=getCarImgUrl(car.photo)>
                    <span class = "car-year-make">
                        {{ car.year }}
                        
                        {{ car.make }}
                    </span>
                    <span class = "car-price">
                        <i class = "fa fa-tag"></i> {{ car.price }}
                    </span>
                    <span class = "car-model">
                        {{ car.model }}
                    </span>
                    <br>
                    <br>
                    <button class = "view-details" @click=getCar(car.id) >View Details</button>
                </li>
            </ul>
            </div>
        </div>   
        <!--
        {% end block %}
        -->
            </body>
        </html>
        `,
    created() {
        let self = this;
 
        fetch('/api/search',
            {
                method: 'GET',
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token"),
                    //'X-CSRFToken': token
                },
                //credentials: 'same-origin'
            })
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                console.log(data);
                self.results = data.results;
                console.log(self.results)
            })
    },
    data() {
        return {
            results: []
        }
    },
    methods: {
        getImgUrl(pic) {
            return '../static/uploads/'+ pic;
        },

        getCarImgUrl(pic) {
            return '../static/car_uploads/'+ pic;
        },
 
        getCar(id){
            this.$router.push({path:'/cars/' + id, query: {uid:id}})
        }
    }
};

const Home = {
    name: 'Home',
    template: `
    <div class="jumbotron">
        <h1>Project 2</h1>
        <p class="lead">In this lab we will demonstrate VueJS working with Forms and Form Validation from Flask-WTF.</p>
            <button><router-link class="nav-link" to="/login">Login<span class="sr-only">(current)</span></router-link></button>
            <button><router-link class="nav-link" to="/register">Sign Up<span class="sr-only">(current)</span></router-link></button>
            <button @click="removeToken">Log Out</button>
    </div>
    

    `,
    data() {
        return {}
    },
    methods: {
        removeToken() {
            localStorage.removeItem("token");
            localStorage.removeItem("user_id");
            console.info("Token removed from localStorage.");
            alert("Token removed!");
        }
    }
};

const NotFound = {
    name: 'NotFound',
    template: `
    <div>
        <h1>404 - Not Found</h1>
    </div>
    `,
    data() {
        return {}
    }
};

const GetToken = {
    name: 'GetToken',
    template: `<!--<div class="carDiv">
            <h2>This Car</h2>
            <div>
            <img v-bind:src=getImgUrl(car_data.photo)>
            <p> Year: {{ car_data.year }} </p> <p> Manufacturer: {{ car_data.make }} </p>
            <p> Model: {{ car_data.model }} </p>
            <p> Description: {{ car_data.description }} </p>
            <p> Price: {{ car_data.price }} </p>
            <p> Type: {{ car_data.car_type }} </p>
            <p> Colour: {{ car_data.colour }} </p>
 
            <button @click="addFavourite" >Add to Favourite</button>
            <button>Email Owner</button>
 
            </div>
            
        </div>-->
                
                <div id = "user-token">
                    <p>
                        Your request is being processed. Your token is <a id = "tok" href = ""> {{ tok }} </a>
                    <p>
                    <button @click = "viewResults">View My Search Results</button>
                </div>
            </body>
        </html>`,
        created() {
            let self = this;
     
            fetch('/api/set',
                {
                    
                    method: 'GET',
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    console.log(data);
                    self.tok = data[0];
                    console.log(self.tok)
                })
                
        },
        data() {
            return {
                tok: []
            }
        },
        methods: {
            
            viewResults(){
                let tok = document.getElementById("tok").innerHTML;
                window.location.href = "/get?tok=" + tok
            }, 
            
            searchCar(){
                let form = document.getElementById('search-form');
                let form_data = new FormData(form);
                
                
                console.log("HI");
                fetch("/api/search", {
                    
                    method: 'POST',
                    body: form_data,
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                        'X-CSRFToken': token
                    },
                    credentials: 'same-origin'
                    
                })
                .then(function (response) {
                    return response.json();
                })
                .then(function (jsonResponse) {
                    //display a success message
                    console.log(jsonResponse);
                    self.errors = jsonResponse.errors;
                    window.location.href = "/search/" ;
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
};

const GetResults = {
    name: 'GetResults',
    template: `<!--<div class="carDiv">
            <h2>This Car</h2>
            <div>
            <img v-bind:src=getImgUrl(car_data.photo)>
            <p> Year: {{ car_data.year }} </p> <p> Manufacturer: {{ car_data.make }} </p>
            <p> Model: {{ car_data.model }} </p>
            <p> Description: {{ car_data.description }} </p>
            <p> Price: {{ car_data.price }} </p>
            <p> Type: {{ car_data.car_type }} </p>
            <p> Colour: {{ car_data.colour }} </p>
 
            <button @click="addFavourite" >Add to Favourite</button>
            <button>Email Owner</button>
 
            </div>
            
        </div>-->
                <link rel = 'stylesheet' href = '../static/css/search_results.css'/>
                
               <div id = "result-area">
                    <h3>Search Results</h3>
                    <em>**Click the table headings to sort the list by those parameters</em>
                    <hr>
                    <table id = "search-results">
                        <tr>
                            
                            <th> Lot Address </th>
                            <th class = 'spaces_occ'  @click = "sort('spaces_occ')"> Spaces Occupied  <i id = 'spaces_occ-head' class = "fa fa-sort"></i></th>
                            <th class = 'capacity'  @click = "sort('capacity')"> Capacity <i id = 'capacity-head' class = "fa fa-sort"></i></th>
                            <th class = 'spaces_rem'  @click = "sort('spaces_rem')"> Remaining <i id = 'spaces_rem-head' class = "fa fa-sort"></i></th>
                            <th class = 'rating'  @click = "sort('rating')"> Rating <i id = 'rating-head' class = "fa fa-sort"></i></th>
                            <th class = 'rate'  @click = "sort('rate')"> Hourly Rate/$JMD <i id = 'rate-head' class = "fa fa-sort"></i></th>
                            <th> Apply for Reservation </th>
                        </tr>
                        <tr v-for = "lot in lots">
                            
                            <td> {{ lot.lot_addr }} </td>
                            <td class = 'spaces_occ'> {{ lot.occupied }} </td>
                            <td class = 'capacity'> {{ lot.cap }} </td>
                            <td class = 'spaces_rem'> {{ lot.remaining }} </td>
                            
                            <td class = 'rating-star'>
                                <div v-bind:style=getRating(lot.rating) class="stars">
                                    <span class = 'score-tooltip'>{{ lot.rating }}/5</span>
                                </div>
                            </td>
                            <td class = 'rate' style = ""> {{ lot.rate }} </td>
                            <td> <button @click = "applyForRes(lot.id, lot.rate)">Reserve</button> </td>
                            <td class = 'rating' style = "display:none;"> {{ lot.rating }} </td>
                            <td class = 'id' style = "display:none;"> {{ lot.id }} </td>
                            
                        </tr>
                    </table>
                    
                    <br>
                    <div id = "reserve-form" class = "modal">
                        <div class = "modal-content">
                            <span @click = "close_modal('reserve-form')" class = "close">Close <i id = "close-modal" class = "fa fa-close"></i></span>
                            <hr>
                            <h3>Input your reservation information below: </h3>
                            <em>**Reservations can only be placed for the current date</em>
                            <form id = "reservation-form" method = "POST" @submit.prevent = "reserve">
                                <input type = "text" name = "lot_id" id = "lot_id" hidden/>
                                <input class = "form-input" name = "res_rate" id = "res_rate" readonly/>
                                <input name = "res-lot-id" id = "res-lot-id" style = "display:none;"/>
                                <input required class = "form-input" type = "text" name = "driver_name" id = "driver_name" placeholder= "Driver's name..."/>
                                <br>
                                <input required class = "form-input" type = "text" name = "license_plate" id = "license_plate" placeholder= "Vehicle's license place number..."/>
                                <br>
                                <input required class = "form-input" type = "text" name = "start_time" id = "start_time" placeholder = "From: 0:00 - 23:59"/>
                                <br>
                                <input required class = "form-input" type = "text" name = "end_time" id = "end_time" placeholder = "To: 0:00 - 23:59"/>
                                <br>
                                <input  class = "form-input form-btn" type = "submit" id = "submit-reservation" value = "Apply for reservation!"/>
                            </form>
                        </div>
                    </div>
                    <div id = "payment-form" class = "modal">
                        <div class = "modal-content">
                            <span @click = "close_modal('payment-form')" class = "close">Close <i id = "close-modal" class = "fa fa-close"></i></span>
                            <hr>
                            <h3>Confirm your reservation information below: </h3>
                            <form id = 'stripe-form' method = "POST" @submit.prevent = "pay_for_res">
                                
                                <br>
                                <!--
                                -->
                                <span class = "res-info"><b>Driver's Name:</b><span id = "dummy-name"></span></span>
                                <br>
                                <span class = "res-info"><b>License Plate:</b><span id = "dummy-plate"></span></span>
                                <br>
                                <span class = "res-info"><b>Rate: </b><span id = "dummy-rate"></span></span>
                                <br>
                                <span class = "res-info"><b>Start Time: </b><span id = "dummy-start"></span></span>
                                <br>
                                <span class = "res-info"><b>End Time: </b><span id = "dummy-end"></span></span>
                                <br>
                                <button id = "price-btn" class = "form-input form-btn" id = "checkout-btn" class = "form-input form-btn" type = "submit">Proceed to Checkout</button>
                            </form>
                        </div>
                    </div>
                    <div id = "form-success" class = "modal">
                        <div class = "modal-content">
                            <span @click = "close_modal('form-success')" class = "close">Close <i id = "close-modal" class = "fa fa-close"></i></span>
                            <div class="background"></div>
                                <div class="container">
                                    <div class="row">
                                        <div class="modalbox success col-sm-8 col-md-6 col-lg-5 center animate">
                                            <div class="icon">
                                                <span class="glyphicon glyphicon-ok"></span>
                                            </div>
                                            <!--/.icon-->
                                            <h1>Success!</h1>
                                            <p>We've sent a confirmation to your e-mail
                                                <br>for verification.</p>
                                            <button type="button" class="redo btn">Ok</button>
                                            
                                        </div>
                                        <!--/.success-->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id = "form-failure" class ="modal">
                        <div class = "modal-content">
                        <span @click = "close_modal('form-failure')" class = "close">Close <i id = "close-modal" class = "fa fa-close"></i></span>
                        <hr>            
                        <!--/.row-->
                            <div class="background"></div>
                            <div class="container">
                                <div class="row">
                                    <div class="modalbox error col-sm-8 col-md-6 col-lg-5 center animate" style="display: none;">
                                        <div class="icon">
                                            <span class="glyphicon glyphicon-thumbs-down"></span>
                                        </div>
                                        <!--/.icon-->
                                        <h1>Oh no!</h1>
                                        <p>Oops! Something went wrong,
                                            <br> you should try again.</p>
                                        <button type="button" class="redo btn">Try again</button>
                                        
                                    </div>
                                    <!--/.success-->
                                </div>
                                <!--/.row-->
                            </div>
                                <!--/.container-->
                            </div>
                        </div>
                    </div>
                    <div id = "qr-code" class = "modal">
                        <div class = "modal-content">
                            <span @click = "close_modal('qr-code')" class = "close">Close <i id = "close-modal" class = "fa fa-close"></i></span>
                            <hr>
                        </div>
                    </div>
                    <hr>
                    <button id = "previous_page" @click = "previousPage">Previous Page</button>
                    <button id = "get-more" @click = "viewMore">Next Page</button>
                    <br>
                    <br>
                    <em>Showing results <b>{{start}}</b>-<b>{{end}}</b> of {{total_results}}</em>
                    <br>
               </div>
            </body>
        </html>`,
        created() {
            let self = this;
            let tok = this.$route.query.tok
            let page = this.$route.query.page
            
            fetch('/api/get?tok=' + tok + "&page=" + page,
                {
                    method: 'GET',
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    self.tok = tok
                    self.lots = data.lots;
                    self.start = data.start;
                    self.end = data.end;
                    self.total_results = data.num_lots;
                })
                
        },
        data() {
            return {
                lots: []
                
            }
        },
        methods: {
            viewMore(){
                console.log("hallo");
                let tok = this.$route.query.tok;
                let page = parseInt(this.$route.query.page);
                if (isNaN(page))
                {
                    page = 1;
                }
                page+= 1;
                window.location.href ="/get?tok=" + tok + "&page=" + page;
                
            },

            previousPage(){
                console.log("hallo");
                let tok = this.$route.query.tok;
                let page = parseInt(this.$route.query.page);
                if (isNaN(page))
                {
                    page = 1;
                }
                if (page == 1)
                {

                }
                else
                {
                    page-= 1;
                    window.location.href ="/get?tok=" + tok + "&page=" + page;
                }
            },

            show_rating(rate)
            {
                this.innerHTML = "<span class = 'rating-tooltip'>"+rate+"/5</span>";
            },

            pay_for_res(){
                let stripe = window.Stripe('pk_test_51IqZX9ChKOji6H1VUywrb4QubopQ5YQSWWz2d1OcLoktaFfaaVxHIKVO9eTlPmka70Ur7oTYA5phYecHUKxFDYw800KtCdYA4z');
                let form = document.getElementById("reservation-form")
                let data = new FormData(form)
                var queryString = $('#reservation-form').serialize();
                console.log(queryString)
                fetch("/api/create-checkout-session/",
                {
                    
                    method:"POST",
                    headers: {
                        'X-CSRFToken': token
                    },
                    body: data,
                    credentials: 'same-origin'
                })
                .then(function (response)
                {
                    return response.json();
                })
                .then(function (session)
                {
                    return stripe.redirectToCheckout({ sessionId: session.id });
                })
                .then(function (result) 
                {
                // If redirectToCheckout fails due to a browser or network
                // error, you should display the localized error message to your
                // customer using error.message.
                    if (result.error) 
                    {
                        alert(result.error.message);
                    }
                })
                .catch(function (error) 
                {
                    console.error("Error:", error);
                });
            },

            sort(attr){
                console.log(attr)
                let dir = "desc"
                let table = document.getElementById("search-results");
                let rows, switching, i, x, y, shouldSwitch, switch_count = 0;
                rows = table.rows;
                let head_id = attr + "-head" 
                let head = document.getElementById(head_id)
                
                
                switching = true;
                while(switching)
                {
                    if (dir == "asc")
                    {
                        head.classList.remove("fa-sort")
                        head.classList.remove("fa-sort-desc")
                        head.classList.add("fa-sort-asc")
                    }
                    else
                    {
                        head.classList.remove("fa-sort")
                        head.classList.add("fa-sort-desc")
                        head.classList.remove("fa-sort-asc")
                    }
                    switching = false;
                    
                    for (i = 1;i<rows.length-1;i++)
                    {
                        x = rows[i].getElementsByClassName(attr)[0].innerHTML;
                        y = rows[i+1].getElementsByClassName(attr)[0].innerHTML;
                        if(dir == "desc")
                        {

                            if (parseFloat(x) < parseFloat(y))
                            {
                                shouldSwitch = true;
                                break;
                            }
                        }
                        else
                        {
                            if (parseFloat(x) > parseFloat(y))
                            {
                                shouldSwitch = true;
                                break;
                            }
                        }
                    }
                    if (shouldSwitch) {
                        rows[i].parentNode.insertBefore(rows[i+1], rows[i]);
                        switching = true;
                        switch_count++;
                    }
                    else
                    {
                        if(switch_count == 0 && dir == "desc") 
                        {
                            dir = "asc";
                            switching = true;
                        }
                    }
                }
            },
            
            getRating(rating){
                return "--rating: " + rating;
            },

            applyForRes(id, rate)
            {
                console.log(id)
                let form = document.getElementById("reserve-form");
                form.style.display = "inline-block";
                let id_field = document.getElementById('lot_id');
                let res_rate = document.getElementById('res_rate');
                
                res_rate.value = rate;
                id_field.value = id;
                id_field = document.getElementById('res-lot-id');
                id_field.value = id;
                console.log(id_field.value);
            },

            /*
                register() {
                    let self = this;
                    let registerForm = document.getElementById('registerForm');
                    let form_data = new FormData(registerForm)
                    console.log(token);

                    fetch("/api/register", {
                        method: 'POST',
                        body: form_data,
                        headers: {
                            'X-CSRFToken': token
                        },
                        credentials: 'same-origin'
                    })
                        .then(function (response) {
                            return response.json();
                        })
                        .then(function (jsonResponse) {
                            //display a success message
                            self.errors = jsonResponse.errors;
                            console.log(jsonResponse);
                            if(jsonResponse['message'] == "User regristration Successful")
                            {
                                window.location.href = "/login"
                            }
                            else{
                                console.log("i forgot my password :(")
                            }
                        })
                        .catch(function (error) {
                            console.log(error);
                        });
                }
            */
            reserve(){
                let form = document.getElementById('reservation-form');
                let data = new FormData(form);
                let lot_id = document.getElementById('lot_id');
                let dummy_name = document.getElementById('dummy-name');
                let dummy_rate = document.getElementById('dummy-rate');
                let dummy_plate = document.getElementById('dummy-plate');
                let dummy_start = document.getElementById('dummy-start');
                let dummy_end = document.getElementById('dummy-end');

                dummy_name.innerHTML = document.getElementById("driver_name").value
                dummy_rate.innerHTML = document.getElementById("res_rate").value
                dummy_plate.innerHTML = document.getElementById("license_plate").value
                dummy_start.innerHTML = document.getElementById("start_time").value
                dummy_end.innerHTML = document.getElementById("end_time").value
                // REMOVE THIS LINE
                // YEAH THE LINE BELOW
                localStorage.setItem('user_id', 1)
                //THIS IS THE LINE IM TALKING ABOUT ABOVE THIS
                fetch("/api/reserve/" + localStorage.getItem('user_id') +"/" + lot_id.value,
                {
                    method: 'POST',
                    body: data,
                    headers: {
                        'X-CSRFToken': token
                    },
                    credentials: 'same-origin'
                })
                .then(function (response){
                    return response.json()
                })
                .then(function (jsonResponse){
                    self.errors = jsonResponse.errors;
                    console.log(jsonResponse);
                    document.getElementById('reserve-form').style.display = 'none';
                    document.getElementById('payment-form').style.display = 'inline-block';
                })
                
            },

            close_modal(target)
            {
                let modal = document.getElementById(target);
                modal.style.display = "none";
            },

            searchCar(){
                
            }
        }
};

const UnsetToken = {
    name: 'ViewCar',
    template: `<!--<div class="carDiv">
            <h2>This Car</h2>
            <div>
            <img v-bind:src=getImgUrl(car_data.photo)>
            <p> Year: {{ car_data.year }} </p> <p> Manufacturer: {{ car_data.make }} </p>
            <p> Model: {{ car_data.model }} </p>
            <p> Description: {{ car_data.description }} </p>
            <p> Price: {{ car_data.price }} </p>
            <p> Type: {{ car_data.car_type }} </p>
            <p> Colour: {{ car_data.colour }} </p>
 
            <button @click="addFavourite" >Add to Favourite</button>
            <button>Email Owner</button>
 
            </div>
            
        </div>-->
                <link rel = 'stylesheet' href= '../static/css/details.css'/>
                <div id = "car-card">
                    <div id="car-detail-image">
                        <img v-bind:src=getImgUrl(car_data.photo) class = "car-picture"/>
                    </div>
                    <div id = "car-detail">
                        <h2 id = "car-year">{{ car_data.year }} {{ car_data.make }}</h2>
                        <h3 id = "car-model">{{ car_data.model }}</h3>
                    
                    
                    
                        <p id = "description">
                            {{ car_data.description }}
                        </p>
                        <br>
                        <div id = "car-values">
                            <span class = "car-info">
                                <span class = "detail-title">Color</span>
                                <span class = "detail-value">{{car_data.colour}}</span>
                            </span>
                            <span class = "car-info">
                                <span class = "detail-title">Body Type</span>
                                <span class = "detail-value">{{car_data.car_type}}</span>
                            </span>
                            <span class = "car-info">
                                <span class = "detail-title">Price</span>
                                <span class = "detail-value">$ {{car_data.price}}</span>
                            </span>
                            <span class = "car-info">
                                <span class = "detail-title">Transmission</span>
                                <span class = "detail-value">{{car_data.transmission}}</span>
                            </span>
                        </div>
                        <br>
                        <span>
                            <button id = "email-owner">Email Owner</button>
                            <button id = "add-favourite" @click="addFavourite"><i id = "heart" class = "fa fa-heart-o" ></i></button>
                            
                        </span>
                    </div>
                    <br>
                    
                        
                        
                    
                </div>
                <!--
                {% end block %}
                -->
            </body>
        </html>`,
        created() {
            let self = this;
     
            fetch('/api/cars',
                {
                    
                    method: 'GET',
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    }
                })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    console.log(data);
                    self.cars = data.carlist;
                    console.log(self.cars)
                })
                
        },
        data() {
            return {
                cars: []
            }
        },
        methods: {
            getImgUrl(pic) {
                return '../static/uploads/'+ pic;
            },
    
            getCarImgUrl(pic) {
                return '../static/car_uploads/'+ pic;
            },
     
            getCar(id){
                this.$router.push({path:'/cars/' + id, query: {uid:id}})
            },
    
            
            searchCar(){
                let form = document.getElementById('search-form');
                let form_data = new FormData(form);
                
                
                console.log("HI");
                fetch("/api/search", {
                    
                    method: 'POST',
                    body: form_data,
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                        'X-CSRFToken': token
                    },
                    credentials: 'same-origin'
                    
                })
                .then(function (response) {
                    return response.json();
                })
                .then(function (jsonResponse) {
                    //display a success message
                    console.log(jsonResponse);
                    self.errors = jsonResponse.errors;
                    window.location.href = "/search/" ;
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
};

// Define Routes
const routes = [
    { path: "/", component: Home },
    // Put other routes here
    { path: "/register", component: RegisterForm },
    { path: "/login", component: LoginForm },
    { path: "/cars/new", component: CarForm },
    { path: "/explore", component: ViewCars },
    { path: "/users/:user_id", component: ViewUser},
    { path: "/cars/:car_id", component: ViewCar},
    { path: "/search/", component: SearchResults},
    { path: "/set/", component: GetToken},
    { path: "/get/", component: GetResults},
    { path: "/unset/:token", component: UnsetToken},
    { path: "/cars/:user_id/favourites", component: ViewUser},
    // This is a catch all route in case none of the above matches
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound }
];

const router = VueRouter.createRouter({
    history: VueRouter.createWebHistory(),
    routes,
});

app.use(router);

app.mount('#app');