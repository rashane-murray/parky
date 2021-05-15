from . import db
import json
from werkzeug.security import generate_password_hash

class Lot(db.Model):
    __tablename__ = 'lots'

    lot_id = db.Column(db.Integer, primary_key = True)
    owner_id = db.Column(db.Integer)
    street_addr = db.Column(db.String(60))
    capacity = db.Column(db.Integer)
    occupied = db.Column(db.Integer)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    hourly_rate = db.Column(db.Float)
    num_ratings = db.Column(db.Integer)
    avg_rating = db.Column(db.Float)
    certified = db.Column(db.Boolean)
    title_address = db.Column(db.String(60))

    def __init__(self, street_addr, latitude, longitude, hourly_rate, title_address, owner_id, capacity):
        self.street_addr = street_addr
        self.owner_id = owner_id
        self.capacity = capacity
        self.latitude = latitude
        self.longitude = longitude
        self.hourly_rate = hourly_rate
        self.title_address = title_address
        self.certified = False
        self.avg_rating = 0
        self.num_ratings = 0
        self.occupied = 0

    def get_id(self):
        try:
            return unicode(self.id)  # python 2 support
        except NameError:
            return str(self.id)  # python 3 support

class User(db.Model):
    # You can use this to change the table name. The default convention is to use
    # the class name. In this case a class name of UserProfile would create a
    # user_profile (singular) table, but if we specify __tablename__ we can change it
    # to `users` (plural) or some other name.
    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50))
    password_hash = db.Column(db.String(255))
    salt = db.Column(db.Integer)
    fname = db.Column(db.String(40))
    lname = db.Column(db.String(40))
    email = db.Column(db.String(30))
    TRN = db.Column(db.String(12))
    role = db.Column(db.String(2))
    
    def __init__(self, username, password, salt, fname, lname, email, TRN, role):
        self.username = username
        self.salt = salt
        self.password_hash = generate_password_hash((password + str(salt)), method='pbkdf2:sha256')
        self.fname = fname
        self.lname = lname
        self.email = email
        self.TRN = TRN
        self.role = role

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        try:
            return unicode(self.id)  # python 2 support
        except NameError:
            return str(self.id)  # python 3 support

    def __repr__(self):
        return '<User %r>' % (self.username)

class Reservation(db.Model):

    __tablename__ = 'reservations'

    res_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer)
    lot_id = db.Column(db.Integer)
    end_time = db.Column(db.String(6))
    start_time = db.Column(db.String(6))
    driver_name = db.Column(db.String(40))
    media_address = db.Column(db.String(70))
    license_plate = db.Column(db.String(10))
    state = db.Column(db.String(2))

    def __init__(self, user_id, lot_id, start_time, end_time, driver_name, license_plate, media_address):
        self.user_id = user_id
        self.lot_id = lot_id
        self.end_time = end_time
        self.start_time = start_time
        self.driver_name = driver_name
        self.media_address = media_address
        self.license_plate = license_plate
        self.state = "P"

    def get_id(self):
        try:
            return unicode(self.id)  # python 2 support
        except NameError:
            return str(self.id)  # python 3 support