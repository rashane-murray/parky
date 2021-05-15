"""
Flask Documentation:     http://flask.pocoo.org/docs/
Jinja2 Documentation:    http://jinja.pocoo.org/2/documentation/
Werkzeug Documentation:  http://werkzeug.pocoo.org/documentation/
This file creates your application.
"""
import os
import qrcode
import stripe
from app import app, db, login_manager
from json import JSONEncoder
from flask import render_template, request, redirect, url_for, flash, jsonify, make_response
from flask_login import login_user, logout_user, current_user, login_required
from .forms import LoginForm, RegisterUserForm, AddCarForm, SearchForm, ReservationForm
from .exceptions import LotIsFullError
from .models import User, Reservation, Lot
from werkzeug.security import check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
from random import random, choice
from math import floor, ceil
from secrets import token_urlsafe
import stripe

stripe.api_key = app.config['STRIPE_SECRET']

# Using JWT
import jwt, base64
from flask import _request_ctx_stack
from functools import wraps

class MyEncoder(JSONEncoder):
    def default(self, o):
        return o.__dict__  

global NUM_REQUESTS 
global REQUESTS  #setting the requests to be a blank dictionary of requests
global INUSE_FLAG 
ALPHA = "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z".split()



NUM_REQUESTS = 0
REQUESTS = {}
INUSE_FLAG = 0
LOTS = []

def make_lots(n = 100):
    return [random_lot() for x in range(n)]

def random_lot():
    cap = floor(random()*100)
    occ =floor(random()*cap)
    rem = cap - occ
    lot = {
        "id": floor(random()*100),
        "cap": cap,
        "occupied": occ,
        "remaining": rem,
        "rate": round(random()*500, 2),
        "rating" : round(random()*5, 2),
        "lot_addr": "{} {}".format(''.join([choice(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) for x in range(4)]), ''.join([choice(ALPHA) for x in range(12)]))
    }
    return lot

def slice_results(lst, page, slice_size = 20):
    start_index = slice_size*(page-1)
    return (lst[start_index:(start_index+slice_size)])

def get_res_slice(lst, n = 20):
    for x in range(0, len(lst), n):
        yield lst[x:x+n] # try/except not needed, list slice automatically cuts iteration if index is out of range

@app.route("/")
def prepare():
    pass    

@app.route("/api/set")
def set_token():
    global NUM_REQUESTS 
    global REQUESTS  #setting the requests to be a blank dictionary of requests
    # atomicise these actions, semaphore unnecessary
    tok = token_urlsafe(16)
    lst = make_lots(n = 100)
    REQUESTS[tok] = lst
    return jsonify(tok, 200)
    

def subtract_times(start, end):
    start = list(map(int, start.split(":")))
    end = list(map(int, end.split(":")))
    hours = end[0] - start[0]
    minutes = end[1] - start[1]
    if (minutes < 0):
        hours -= 1
        minutes = 60+minutes
    return (hours + (minutes/60))

@app.route("/api/create-checkout-session/", methods = ["POST"])
def create_checkout_session():
    form = ReservationForm()
    if (request.method == "POST"):
        checkout_session = stripe.checkout.Session.create(
            payment_method_types = ['card'],
            line_items = 
            [
                {
                    'price_data': 
                    {
                        'currency': 'usd',
                        'unit_amount': int(float(form.res_rate.data)*100),
                        'product_data': 
                        {
                            'name': 'Reservation at Lot ID: {}'.format(form.lot_id.data),
                        },
                    },
                    
                    'quantity': int(ceil(subtract_times(start = form.start_time.data, end = form.end_time.data))),
                },
            ],
            mode = 'payment',
            success_url = "http://127.0.0.1:5000/set",
            cancel_url = "http://127.0.0.1:5000/set"
        )
        print(checkout_session)
        return jsonify({'id':checkout_session.id}), 200
    

@app.route('/api/pay_success')
def payment_success():
    flash("Payment successful", "success")
    return redirect("/set")

@app.route('/api/pay_failure')
def payment_failure():
    flash("Payment failed", "danger")
    return redirect("/set")

@api.route('/api/reservations/<user_id>')
def get_reservations(user_id):
    try:
        reservations = []
        role = request.args.get('role')
        if (role == "owner"):
            lots = Lot.query.filter_by(owner_id = user_id) # Get the list of lots the user owns
            for lot in lots:
                reservations.append(Reservation.query.filter_by(lot_id = lot.lot_id)) # Get the reservations pending on each lot
        elif (role == "motorist"):
            reservations = Reservation.query.filter_by(user_id = user_id)
        reservations = list(map(make_reservation_dict, reservations))
        return jsonify(reservations), 200
    except Exception as e:
        print(e)
        return jsonify (error = str(e)), 403


@app.route("/api/reserve/<user_id>/<lot_id>", methods= ['POST'])
def reserve_lot(lot_id, user_id):
    form = ReservationForm()
    if(request.method == 'POST'):
        if (form.validate_on_submit()):
            try:
                lot = Lot.query.filter_by(lot_id = lot_id).with_for_update().one() # locks the lot record so capacity can be changed
                if(lot.occuped == lot.capacity):
                    raise LotIsFullError
                lot.occupied += 1
                db.session.add(lot)
                db.session.commit() # unlocks the record so that it can be edited again
            except LotIsFullError:
                response = {
                    "message": "This lot is already at capacity, try again later"
                }
                return jsonify(response), 403
            start = form.start_time.data
            end = form.end_time.data
            driver_name = form.driver_name.data
            license_plate = form.license_plate.data
            img = qrcode.make(data = "{}|{}|{}|{}|{}|{}".format(lot_id, user_id, start, end, driver_name, license_plate))
            
            path = secure_filename("{}_{}_{}.png".format(license_plate, ''.join(driver_name.split()), user_id))
            path = ''.join((os.getcwd(), app.config['RESERVATIONS'], path))
            
            img.save(path)
            res = Reservation(user_id=user_id, lot_id=lot_id, media_address = path, start_time = start, end_time = end, driver_name = driver_name, license_plate = license_plate)
            try:
                db.session.add(res)
                db.session.commit()
                response = {
                    "message":"Reservation creation successful.",
                }
                return jsonify(response), 200
            except Exception as e:
                print("Error occurred: {}".format(e))
                response = {
                    "message": "An error occurred.",
                }
                return jsonify(response), 500
        else:
            print(form.errors)
            response = {
                    "message": "An error occurred.",
                }
            return jsonify(response), 500

@app.route("/api/get", methods = ['GET'])
def get_results():
    print("hello")
    try:
        token = request.args.get('tok')
        try:
            page = int(request.args.get('page'))
        except:
            page = 1
        lst = slice_results(lst = REQUESTS[token], page = page)
        response = {
                "tok": token,
                "message": "List of options",
                "lots": lst,
                "start": (20*(page-1))+1,
                "end": (20*(page)),
                "num_lots": len(REQUESTS[token])
            }
        
        return jsonify(response), 200
    except StopIteration:
        msg = "No more results in this list!"
        return jsonify(msg, 200)
    except Exception as e:
        
        msg = "Unknown Error occurred: Error details: {}".format(e)
        print(msg)
        return jsonify(msg, 500)

@app.route("/free_set")
def set_free_token():
    global NUM_REQUESTS 
    global REQUESTS
    NUM_REQUESTS += 1
    tok = token_urlsafe(16)
    lst = [floor(random()*1000) for x in range (0, 100)]
    print("{}: ".format(tok), end = "")
    print(lst)
    REQUESTS[tok] = get_res_slice(lst)
    msg = "Good news, your request is being processed. Your token is: {}".format(tok)
    return render_template("base.html", message = msg, tok = tok)

@app.route("/get/<token>/<num_res>")
def get_n_results(token, num_res):
    try:
        msg = next(REQUESTS[token], num_res)
        return render_template("base.html", message = msg, tok = None)
    except StopIteration:
        msg = "No more results in this request!"
        return render_template("base.html", message = msg, tok = None)
    except IndexError:
        msg = "No more results in this request!"
        return render_template("base.html", message = msg, tok = None)
    except Exception as e:
        msg = "Unknown Error occurred: Error details: {}".format(e)
        return render_template("base.html", message = msg, tok = None)


#JWT Token checking
def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', None)
        if not auth:
            return jsonify({'code': 'authorization_header_missing', 'description': 'Authorization header is expected'}), 401
        sections = auth.split()
        if sections[0].lower() != 'bearer':
            return jsonify({'code': 'invalid_header', 'description': 'Authorization header must start with bearer'}), 401 
        elif len(sections) == 1:
            return jsonify({'code': 'invalid_header', 'description': 'Token not found'}), 401
        elif len(sections) > 2:
            return jsonify({'code': 'invalid_header', 'description': 'Authorization header must bearer + \s + token'}), 401
         
        token = sections[1]
        try:
            ids = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])

        except jwt.ExpiredSignatureError:
            return jsonify({'code': 'expired_token', 'description': 'Your token is expired'}), 401
        except jwt.DecodeError:
            return jsonify({'code': 'token_invalid_signature', 'description': 'Token signature is invalid'}), 401

        g.current_user = user = ids
        return f(*args, **kwargs)
    return decorated

###
# Routing for your application.
###

# Please create all new routes and view functions above this route.
# This route is now our catch all route for our VueJS single page
# application.
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def home(path):
    """Render website's home page."""
    return render_template('index.html')

#NEED TO FIX JWT TOKEN
@app.route("/api/auth/login", methods=["GET", "POST"])
def login():
    form = LoginForm()
    if request.method == "POST" and form.validate_on_submit():        
        if form.username.data:
            # Get the username and password values from the form.
            username = form.username.data
            password = form.password.data
            # using your model, query database for a user based on the username
            # and password submitted. Remember you need to compare the password hash.
            # You will need to import the appropriate function to do so.
            # Then store the result of that query to a `user` variable so it can be
            # passed to the login_user() method below.
            user = User.query.filter_by(username=username).first()
            # get user id, load into session
            if user is not None and check_password_hash(user.password, password):
                print(user)
                login_user(user)
                ids = {'user': user.username}
                token = jwt.encode(ids, app.config['SECRET_KEY'], algorithm = 'HS256')

                data = {
                    "message": "Login Successful",
                    "token": token,
                    "user_id": user.id,
                    "success": 1
                }             
                flash ("Login successful!", "success")
                return jsonify(data)
            error = "Incorrect username or password."
            return jsonify(error=error)
    all_errors = form_errors(form)
    return jsonify(errors=all_errors)
    

@app.route("/api/auth/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    if request.method == "POST":
        message = {
            "message": "Log out successful"
        }
        flash("You have been logged out.", "danger")
        return redirect("/login")
    


@app.route("/api/register", methods=["POST"])
def register():
    form = RegisterUserForm()

    if request.method == "POST": # and form.validate_on_submit()
        username = form.username.data
        user = User.query.filter_by(username=username).first()
        if user is None: 
            password = form.password.data
            name = form.name.data
            email = form.email.data
            location = form.location.data
            biography = form.biography.data
            photo = form.photo.data
            print("hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii")
            print(photo)
            filename = secure_filename(photo.filename)
            photo.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            date_joined = datetime.now()
            #NOT SURE IF DATE JOINED MUST BE IN CONSTRUCTOR HERE OR SET IN DB
            newUser = User(username, password, name, email, location, biography, filename, date_joined)

            db.session.add(newUser)
            db.session.commit()
            flash ("User added successfully", "success")
            flash("Please login with your credentials below")
            data = {
                "id": newUser.id,
                "username": username,
                "password": password,
                "name": name,
                "email": email,
                "location": location,
                "biography": biography,
                "photo": filename,
                "date_joined": date_joined
            }
            return jsonify({"message":"User regristration Successful", "username": username, "date_joined" : date_joined, "success":1}) 
        else:
            flash ("Someone is already using this username", "danger")
            return jsonify({"message":"User already registered", "success":0}) 
    else:
        errors = form_errors(form)
        return jsonify(errors=form_errors(errors))

# user_loader callback. This callback is used to reload the user object from
# the user ID stored in the session
@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))

###
# The functions below should be applicable to all Flask apps.
###

@app.route("/api/cars/<car_id>/favourite", methods=["POST"])
@requires_auth
def favourite(car_id):
    if(car_id == 'undefined'):
        car_id = request.args.get('id')
    if request.method == "POST":
        user = User.query.filter_by(username=g.current_user["user"]).first()
        user_id = user.id
        # user_id = g.current_user["user"] #IDK HOW TO GET THIS FROM THE AUTH
        
        newFav = Favourite(car_id, user_id)
        
        try:
            db.session.add(newFav)
            db.session.commit()
            
            response = {
                "message": "Car Successfully Favourited",
                "car_id": car_id
            }
            return jsonify(response), 200
        except Exception as e:
            print(e)
            response = {
                "message": "Access token is missing or invalid",                
            }
            return jsonify(response), 401

     
@app.route("/api/cars/<car_id>/remove_favourite", methods=["POST"])
@requires_auth
def remove_favourite(car_id):
    if(car_id == 'undefined'):
        car_id = request.args.get('id')
    if request.method == "POST":
        user = User.query.filter_by(username=g.current_user["user"]).first()
        user_id = user.id
        # user_id = g.current_user["user"] #IDK HOW TO GET THIS FROM THE AUTH
        
        
        
        try:
            Favourite.query.filter_by(
                car_id = car_id,
                user_id = user_id
            ).delete()
            db.session.commit()
            
            response = {
                "message": "Car Successfully unavourited",
                "car_id": car_id
            }
            return jsonify(response), 200
        except Exception as e:
            print(e)
            response = {
                "message": "Access token is missing or invalid",                
            }
            return jsonify(response), 401


@app.route("/api/search", methods=["POST"])
@requires_auth
def search():
    form = SearchForm()
    results=[]
    if request.method=="POST":
        make = form.make.data
        model = form.model.data
        
        search_cars= Car.query.filter_by(make= make).filter_by(model = model).all()
        print("HIIIIIIIIIIIIIIIIIIIIIIIIIII")
        print(search_cars)
        for c in search_cars:
            car={}
            car['id']=c.id
            car["user_id"]=c.user_id
            car["year"]=c.year            
            car["price"]=c.price
            car["photo"]=c.photo
            car["make"]=c.make
            car["model"]=c.model
            results.append(car)
        return jsonify(results)
    else:
        print(form.errors)

@app.route("/api/users/<user_id>", methods=["GET"])
@requires_auth
def getUser(user_id):
    try:
        print("HELLOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOoo")
        print(user_id)
        user = User.query.filter_by(id=user_id).first()
        print(user.username)
        response = {
            "id": user.id,
            "username": user.username,
            "password": user.password,
            "name": user.name,
            "email": user.email,
            "location": user.location,
            "biography": user.biography,
            "photo": user.photo,
            "date_joined": user.date_joined
        }
        return jsonify(response), 200
    except:
        response = {
            "message": "Access token is missing or invalid"
        }
        return jsonify(response), 401


def make_car_dict(fave: int):
    print("hey")
    car = Car.query.filter_by(id=fave).first()
    buff = {}
    
    buff['make'] = car.__dict__['make']
    buff['model'] = car.__dict__['model']
    buff['photo'] = car.__dict__['photo']
    buff['year'] = car.__dict__['year']
    buff['id'] = car.__dict__['id']
    buff['price'] = car.__dict__['price']
   
    return buff

@app.route("/api/cars/<user_id>/favourites", methods=["GET"])
@requires_auth
def userFavourites(user_id):        
    if request.method == "GET":
        '''try:
            favourites = Favourite.query.filter_by(id=user_id).first()
            fave_car = Car.query.filter_by(id=favourites.car_id).first()
        except:
            favourites = []
            fave_car = '''
        try:
            try:
                print("test 1")
                try:
                    fave_list = Favourite.query.filter_by(user_id=user_id).all()
                except Exception as e:
                    print(e)
            except Exception as e:
                fave_list = ''
            #print("HELLLLLLLLLLLLLOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO")
            #print(fave_list)
            
            print("HEllo")
            print(fave_list)       
            response = {
                "message": "List of Favourites",
                "num_fave": len(fave_list),
                "favourites": [make_car_dict(fav.car_id) for fav in fave_list]
                #"car_id": car_id
            }
            print(response)
            '''if fave_list is not []:
                car_list = []
                for fave in fave_list:
                    car = Car.query.filter_by(fave.car_id).first()
                    car_list.append(car.photo)
                response['car_list'] = car_list
            return jsonify(response), 200'''
            return jsonify(response), 200
        except Exception as e:
            print (e)
            response = {
                "message": "Access token is missing or invalid",                
            }
            return jsonify(response), 401

@app.route('/token')
def generate_token():
    # Under normal circumstances you would generate this token when a user
    # logs into your web application and you send it back to the frontend
    # where it can be stored in localStorage for any subsequent API requests.
    payload = {
        'sub': '12345', 
        'name': 'John Doe',
        'iat': datetime.datetime.now(datetime.timezone.utc),
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=30)
    }
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify(error=None, data={'token': token}, message="Token Generated")

    # If you wanted to store the token in a cookie
    # resp = make_response(jsonify(error=None, data={'token': token}, message="Token Generated"))
    # resp.set_cookie('token', "Bearer " + token, httponly=True, secure=True)
    # return resp




def form_errors(form):
    error_messages = []
    """Collects form errors"""
    
    for field, errors in form.errors.items():
        for error in errors:
            message = u"Error in the %s field - %s" % (getattr(form, field).label.text, error)
            error_messages.append(message)
    return error_messages
    
    




@app.route('/<file_name>.txt')
def send_text_file(file_name):
    """Send your static text file."""
    file_dot_text = file_name + '.txt'
    return app.send_static_file(file_dot_text)


@app.after_request
def add_header(response):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    response.headers['X-UA-Compatible'] = 'IE=Edge,chrome=1'
    response.headers['Cache-Control'] = 'public, max-age=0'
    return response


@app.errorhandler(404)
def page_not_found(error):
    """Custom 404 page."""
    return render_template('404.html'), 404


if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port="8080")