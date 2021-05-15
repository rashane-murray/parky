from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, TextAreaField, SelectField, FileField
from wtforms.validators import InputRequired, Email, DataRequired
from flask_wtf.file import  FileField, FileRequired, FileAllowed


class LoginForm(FlaskForm):
    username = StringField('Username', validators=[InputRequired()])
    password = PasswordField('Password', validators=[InputRequired()])


class RegisterUserForm(FlaskForm):
    username = StringField('Username', validators=[InputRequired()])
    password = PasswordField('Password', validators=[InputRequired()])
    name = StringField('Fullname', validators=[InputRequired()])
    email = StringField('Email', validators=[DataRequired(), Email()])
    location = StringField('Location', validators=[InputRequired()])
    biography = TextAreaField('Biography', validators=[InputRequired()])
    photo = FileField('Photo', validators=[FileRequired(), FileAllowed(['jpg', 'png'])])

class ReservationForm(FlaskForm):
    res_rate = StringField(_name='res_rate', id = 'res_rate')
    driver_name = StringField(_name = 'driver_name', id ='driver_name', validators=[InputRequired()])
    lot_id = StringField(_name = 'lot_id', id ='lot_id', validators=[InputRequired()])
    start_time = StringField(_name ='start_time', id = 'start_time', validators=[InputRequired()])
    end_time = StringField(_name ='end_time', id = 'end_time', validators=[InputRequired()])
    license_plate = StringField(_name = 'license_plate', id ='license_plate', validators=[InputRequired()])


class AddCarForm(FlaskForm):
    make = StringField('Make', validators=[InputRequired()])
    model = StringField('Model', validators=[InputRequired()])
    colour = StringField('Colour', validators=[InputRequired()])
    year = StringField('Year', validators=[DataRequired()])
    price = StringField('Price', validators=[InputRequired()])
    car_type = SelectField("CarType", choices=[('SUV', 'SUV'), ('Sedan', 'Sedan'), ('Truck', 'Truck'), ('Hatchback', 'Hatchback'), ('Minivan', 'Minivan'), ('Pickup', 'Pickup')])
    transmission = SelectField("Transmission", choices=[('Automatic', 'Automatic'), ('Manual', 'Manual')])
    description = TextAreaField('Description', validators=[InputRequired()])
    photo = FileField('Photo', validators=[FileRequired(), FileAllowed(['jpg', 'png'])])


class SearchForm(FlaskForm):
    make = StringField('Make', validators=[InputRequired()])
    model = StringField('Model', validators=[InputRequired()])