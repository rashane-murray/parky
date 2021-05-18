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
from .forms import LoginForm, RegistrationForm, SearchForm, ReservationForm, ChangeStateForm, RegisterLotForm
from .exceptions import LotIsFullError
from .models import User, Reservation, Lot, query
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
from random import random, choice, uniform, randint
from sqlalchemy import create_engine, MetaData
from math import floor, ceil, sqrt
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


global REQUESTS  #setting the requests to be a blank dictionary of requests
global SESSIONS

REQUESTS = {}
SESSIONS = {}

ALPHA = "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z".split()

def make_lots(n = 100):
    return [random_lot() for x in range(n)]


def random_lot():
    cap = randint(0, 100)
    occ =randint(0, cap)
    rem = cap - occ
    lot = {
        "id": randint(0, 100),
        "cap": cap,
        "occupied": occ,
        "owner_id": 3,
        "remaining": rem,
        "rate": round(uniform(100, 500), 2),
        "rating" : round(uniform(0, 5), 2),
        "lot_addr": "{} {}".format(''.join([choice(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) for x in range(4)]), ''.join([choice(ALPHA) for x in range(12)]))
    }
    return lot

def setup_lots(n = 100):
    print("Attempting to set up database")
    for x in range(0, n):
        cap = randint(0, 100)
        owner_id = 3 + (x//20)
        latitude = uniform(17, 19)
        longitude = uniform(-79, -76)
        addr = "{} {}".format(''.join([choice(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) for x in range(4)]), ''.join([choice(ALPHA) for x in range(12)]))
        hourly_rate = uniform(100, 500)
        num_ratings = randint(1, 100)
        rating = uniform(0, 5)
        certified = True
        title_address = None
        sql = ("insert into lots (street_addr, latitude, num_ratings, avg_rating, longitude, hourly_rate, title_address, owner_id, capacity, certified, occupied) values ('{}', {}, {}, {}, {}, {}, {}, {}, {}, {}, {});".format(addr,latitude, num_ratings, rating, longitude, hourly_rate, "NULL", owner_id, cap ,certified, 0)) 
        query(sql)
        #lot = Lot(street_addr=, latitude=, num_ratings=, avg_rating=, longitude=, hourly_rate=, title_address=, owner_id=, capacity=, certified = )
        #db.session.add(lot)
    db.session.commit()

def make_lot_dict(lot):
    buff = {}
    buff['owner_id'] = lot.__dict__['owner_id']

def slice_results(lst, page, slice_size = 20):
    start_index = slice_size*(page-1)
    return (lst[start_index:(start_index+slice_size)])

def get_res_slice(lst, n = 20):
    for x in range(0, len(lst), n):
        yield lst[x:x+n] # try/except not needed, list slice automatically cuts iteration if index is out of range

@app.route("/")
def prepare():
    return redirect("/index")

@app.route("/api/set")
def set_token():
    lat = float(request.args.get('lat'))
    longi = float(request.args.get('long'))
    # Cartesian approximation to a 55m radius around the spots
    low_lat = lat-0.5
    low_longi = longi+0.5
    high_lat = lat+0.5
    high_longi = longi-0.5
    global REQUESTS  #setting the requests to be a blank dictionary of requests
    # atomicise these actions, semaphore unnecessary
    tok = token_urlsafe(16)
    lst = query("SELECT * from lots where latitude > {} and latitude < {} and longitude > {} and longitude < {};".format(low_lat, high_lat, high_longi, low_longi)).fetchall()
    
    REQUESTS[tok] = (lst, (longi, lat))
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
            success_url = "http://127.0.0.1:5000/api/pay_success/{}".format(form.user_id.data),
            cancel_url = "http://127.0.0.1:5000/api/pay_failure"
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

@app.route('/demo_setup', methods = ['GET'])
def setup_demo():
    setup_lots()
    return redirect("/set")

@app.route("/api/reservations/<user_id>", methods= ['GET'])
def get_reservations(user_id):
    try:
        reservations = []
        role = request.args.get('role')
        
        if (role == "O"):
            lots = Lot.query.filter_by(owner_id = user_id) # Get the list of lots the user owns
            for lot in lots:
                buffer = query("SELECT res_id, driver_name, state, license_plate, reservations.lot_id, start_time, end_time, media_address, street_addr FROM reservations INNER JOIN lots ON reservations.lot_id = lots.lot_id where lots.lot_id = {};".format(lot.lot_id)).all()
                
                reservations.append(buffer)
        elif (role == "M"):
            rezzes = query("SELECT res_id, driver_name, state, license_plate, reservations.lot_id, start_time, end_time, media_address, street_addr FROM reservations INNER JOIN lots ON reservations.lot_id = lots.lot_id where reservations.user_id = {};".format(user_id)).all()
            for res in rezzes:
                buff = {
                    "res_id":res['res_id'],
                    "driver_name":res['driver_name'],
                    "state":res['state'],
                    "license_plate":res['license_plate'],
                    "lot_id":res["lot_id"],
                    "start_time":res['start_time'],
                    "end_time":res['end_time'],
                    "qrcode":res['media_address'],
                    "street_addr":res['street_addr'],
                }
                reservations.append(buff)
        response = {
            "reservations": reservations,
            "message": "List of options",
            "num_reservations": len(reservations)
        }
        print(reservations)
        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify (error = str(e)), 405

@app.route("/api/save_changes", methods = ["POST"])
def save_change():
    form = ChangeStateForm()
    print(request.method)
    if (request.method == "POST"):
        if (form.validate_on_submit()):
            try:
                sql = "update reservations set state = '{}' where res_id = {};".format(form.new_state.data, (form.res_id.data))
                print(sql)
                query(sql)
                db.session.commit()
                response = {
                    "message": "success",
                }
                return jsonify(response), 200
            except Exception as e:
                response = {
                    "message": "failure",
                }
                print ("HEllo: {}".format(e))
                return jsonify(response), 405
                
        else:
            response = {
                    "message": "failure",
                    "errors": form_errors(form)
                }
            print(form_errors(form))
            return jsonify(response), 403
    else:
        response = {
            "message": "failure",
            "errors": "Bad Request"
        }
        return jsonify(response), 500

@app.route("/api/reserve/<user_id>/<lot_id>", methods= ['POST'])
def reserve_lot(lot_id, user_id):
    form = ReservationForm()
    if(request.method == 'POST'):
        if (form.validate_on_submit()):
            try:
                lot = query("select * from lots where lot_id = {} for update;".format(lot_id)).first() # locks the lot record so capacity can be changed
                if(lot['occupied'] == lot['capacity']):
                    raise LotIsFullError
                occ = lot['occupied']
                occ += 1
                query("update lots set occupied = {} where lot_id = {};".format(occ, lot_id))
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
            user_id = int(user_id)
            lot_id = int(lot_id)
            query("insert into reservations (user_id, lot_id, media_address, start_time, end_time, driver_name, license_plate, state) values ({}, {}, '{}', '{}', '{}', '{}', '{}', 'P');".format(user_id, lot_id, path, start, end, driver_name, license_plate))
            #res = Reservation(user_id=user_id, lot_id=lot_id, media_address = path, start_time = start, end_time = end, driver_name = driver_name, license_plate = license_plate)
            try:
                
                db.session.commit()
                response = {
                    "message":"Reservation creation successful.",
                }
                REQUESTS[form.token.data] = None
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

def calc_distance(A, B):
    y = (A[0] - B[0])**2
    x = (A[1] - B[1])**2
    return sqrt(y+x)

def score_lot(i):
    
    dist = i['dist']
    rate = round(i['rate'], 2)
    rating = i['rating']
    score = -1*dist - (rate/100) + 2*rating # attempt to scale parameters within the bounds (0, 10) in hopes of reducing the influence of magnitude on the final score of the lot
    return score

@app.route("/api/get", methods = ['GET'])
def get_results():
    print("hello")
    global REQUESTS
    results = []
    buff = {}
    try:
        token = request.args.get('tok')
        try:
            page = int(request.args.get('page'))
        except:
            page = 1
        lst = slice_results(lst = REQUESTS[token][0], page = page)
        point = (uniform(-76, -78), uniform(17, 19))
        for i in lst:
            buff = {
                "lot_id":i['lot_id'],
                "owner_id":i['owner_id'],
                "street_addr":i['street_addr'],
                "capacity":i['capacity'],
                "occupied":i['occupied'],
                "remaining": (i['capacity'] - i['occupied']),
                "dist": round(calc_distance(REQUESTS[token][1], (i['longitude'], i['latitude'])), 3),
                "rate": round(i['hourly_rate'], 2),
                "rating": i['avg_rating'],
            }
            results.append(buff)
        results = sorted(results, key = score_lot)
        response = {
                "tok": token,
                "message": "List of options",
                "lots": results,
                "start": (20*(page-1))+1,
                "end": (20*(page)),
                "num_lots": len(REQUESTS[token][0])
            }
        return jsonify(response), 200
    except StopIteration:
        msg = "No more results in this list!"
        return jsonify(msg, 200)
    except Exception as e:
        
        msg = "Unknown Error occurred: Error details: {}".format(e)
        print(msg)
        return jsonify(msg, 500)

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
@app.route("/api/auth/login", methods=["POST"])
def login():
    form = LoginForm()
    if request.method == "POST" and form.validate_on_submit():        
        if form.email.data:
            # Get the username and password values from the form.
            email = form.email.data
            password = form.password.data
            # using your model, query database for a user based on the username
            # and password submitted. Remember you need to compare the password hash.
            # You will need to import the appropriate function to do so.
            # Then store the result of that query to a `user` variable so it can be
            # passed to the login_user() method below.
            user = query("SELECT * FROM users WHERE email = '{}';".format(email)).first()
            print(user)
            # get user id, load into session
            if user is not None and check_password_hash(user['password_hash'], (password + str(user['salt']))):
                print(user)
                SESSIONS[user['user_id']] = True # mark that the user with this id has a session currently active
                ids = {'user': user['email']}
                token = jwt.encode(ids, app.config['SECRET_KEY'], algorithm = 'HS256')

                data = {
                    "message": "Login Successful",
                    "token": token,
                    "user_id": user['user_id'],
                    "role": user['role'],
                    "email": user['email'],
                    "name": user['name'],
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
    form = RegistrationForm()

    if request.method == "POST": # and form.validate_on_submit()
        email = form.email.data
        user = query("SELECT * from users where email = '{}';".format(email)).first()
        print(user)
        if user is None: 
            password = form.password.data
            conf_pass = form.conf_password.data
            if (password == conf_pass):
                salt = randint(1, 10000)
                pass_hash = generate_password_hash((password + str(salt)), method='pbkdf2:sha256')
                name = form.name.data
                role = form.role.data
                print(role)
                phone_num = form.phone_num.data
                query("insert into users (email, name, role, phone_num, salt, password_hash) values ('{}', '{}', '{}', '{}', {}, '{}');".format(email, name, role, phone_num, salt, pass_hash))
                db.session.commit()
                flash ("User added successfully", "success")
                flash("Please login with your credentials below")
                
                return jsonify({"message":"User regristration Successful", "username": email, "success":1}) 
            else:
                response = {
                    "message": "Error tampering detected. Please try again later."
                }
                return jsonify(response), 403
        else:
            flash ("Someone is already using this username", "danger")
            print("hello")
            return jsonify({"message":"User already registered", "success":0}) 
    else:
        errors = form_errors(form)
        print("ello govna")
        return jsonify(errors=form_errors(errors))

# user_loader callback. This callback is used to reload the user object from
# the user ID stored in the session
@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))

###
# The functions below should be applicable to all Flask apps.
###
@app.route("/api/lots", methods = ["POST"])
def new_lot():
    form = RegisterLotForm()
    owner_id = request.args.get('owner_id')
    if (request.method == "POST"):
        if (form.validate_on_submit()):
            addr = form.street_addr.data
            print("Addr: {}".format(addr))
            rate = float(form.rate.data)
            longitude = uniform(-78, -76)
            latitude = uniform(16, 18)
            capacity = form.capacity.data
            img = form.photo.data
            
            path = secure_filename(img.filename)
            print("Path: {}".format(path))
            path = ''.join((os.getcwd(), app.config['TITLES'], path))
            img.save(path)
            query("INSERT INTO lots (owner_id, street_addr, capacity, occupied, latitude, longitude, hourly_rate, num_ratings, avg_rating, certified, title_address) values ({}, '{}', {}, {}, {}, {}, {}, {}, {}, {}, '{}');".format(owner_id, addr, capacity, 0, latitude, longitude, rate, 0, 0, False, path))
            response = {
                "message":"success"
            }
            db.session.commit()
            return jsonify(response), 200
        else:
            print(form_errors(form))
            response = {
                "message":"form error"
            }
            return jsonify(response), 403
    else:
        print("bad request")
        response = {
            "message":"bad request"
        }
        return jsonify(response), 500

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