from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import flask_script 
import flask_migrate

from app import app # we import the app object from the app module
from app import db

migrate = flask_migrate.Migrate(app, db)
manager = flask_script.Manager(app)
manager.add_command('db', flask_migrate.MigrateCommand)

if __name__ == '__main__':
    manager.run()