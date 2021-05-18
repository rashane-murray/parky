from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, TextAreaField, SelectField, FileField, BooleanField
from wtforms.validators import InputRequired, Email, DataRequired
from flask_wtf.file import  FileField, FileRequired, FileAllowed


class LoginForm(FlaskForm):
    email = StringField(_name='email', id = 'email', validators=[InputRequired()])
    password = PasswordField(_name='password', id = 'password', validators=[InputRequired()])

class RegistrationForm(FlaskForm):
    email = StringField(_name='email', id = 'email', validators=[InputRequired()])
    password = PasswordField(_name='password', id = 'password', validators=[InputRequired()])
    name = StringField(_name='user_name', id = 'user_name', validators = [InputRequired()])
    conf_password = PasswordField(_name='conf_password', id = 'conf_password', validators=[InputRequired()])
    role = SelectField(_name='role', id = 'role', choices = [('DEFAULT', 'Please select a role.'), ('O', 'Lot Owner'), ('M', 'Motorist')])
    phone_num = StringField(_name='phone_num', id = 'phone_num', validators = [InputRequired()])

class RegisterLotForm(FlaskForm):
    street_addr = StringField(_name = "street_addr", id = "street_addr", validators=[])
    rate = StringField(_name="rate", id = "rate", validators=[DataRequired()])
    latitude  = StringField(_name="latitude", id = "latitude", render_kw={'value':18.276054773019183})
    longitude = StringField(_name="longitude", id = "longitude", render_kw={"value":77.66288216013524})
    capacity = StringField(_name = "capacity", id = "capacity")
    photo = FileField(_name = "photo", id = "photo", validators=[FileRequired(), FileAllowed(['jpg', 'png', 'webp'])])

class ReservationForm(FlaskForm):
    res_rate = StringField(_name='res_rate', id = 'res_rate')
    user_id = StringField(_name='user_id', id = 'user_id')
    driver_name = StringField(_name = 'driver_name', id ='driver_name', validators=[InputRequired()])
    lot_id = StringField(_name = 'lot_id', id ='lot_id', validators=[InputRequired()])
    start_time = StringField(_name ='start_time', id = 'start_time', validators=[InputRequired()])
    end_time = StringField(_name ='end_time', id = 'end_time', validators=[InputRequired()])
    license_plate = StringField(_name = 'license_plate', id ='license_plate', validators=[InputRequired()])
    token = StringField(_name = "request_token", id = "request_token")
    pay_later = BooleanField(_name='pay_later', id = "pay_later", validators=[InputRequired()])

class ChangeStateForm(FlaskForm):
    res_id = StringField(_name = "res_id", id = "res_id")
    new_state = StringField(_name = "new_state", id = "new_state")
    review_lot_id = StringField(_name = "review_lot_id", id = "review_lot_id")

class ReviewForm(FlaskForm):
    review_text = StringField(_name = "review_text", id = "review_text")
    rating = SelectField(_name = "rating", id = "rating")
    review_lot_id = StringField(_name = "review_lot_id", id = "review_lot_id")


class SearchForm(FlaskForm):
    street_location = StringField(_name="destination", id = "destination")
    latitude  = StringField(_name="latitude", id = "latitude")
    longitude = StringField(_name="longitude", id = "longitude")