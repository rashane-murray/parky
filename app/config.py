import os

class Config(object):
    """Base Config Object"""
    DEBUG = False
    SECRET_KEY = 'Som3$ec5etK*y'
    DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://postgres:7931_Latias_1828@localhost/parky'
    SQLALCHEMY_TRACK_MODIFICATIONS = False # This is just here to suppress a warning from SQLAlchemy as it will soon be removed
    UPLOAD_FOLDER = './app/static/uploads'
    RESERVATIONS = '/static/reservations/'
    TITLES = '/static/land_titles/'
    # for the ease of the marker, these keys are left as plain text in this vonfig file. We know that in a real system, 
    # we would set them as environment variables and pull them from the os instead, to maintain security
    STRIPE_KEY = 'pk_test_51IqZX9ChKOji6H1VUywrb4QubopQ5YQSWWz2d1OcLoktaFfaaVxHIKVO9eTlPmka70Ur7oTYA5phYecHUKxFDYw800KtCdYA4z'
    STRIPE_SECRET = 'sk_test_51IqZX9ChKOji6H1VMnQuT3vcvHbcDcjJowRZ9VaJ1hcRCPN59snOBtsQL98QCtY5tWb58TOY1XRdwk50GRO46Dw4007VhsRft3'

class DevelopmentConfig(Config):
    """Development Config that extends the Base Config Object"""
    DEVELOPMENT = True
    DEBUG = True

class ProductionConfig(Config):
    """Production Config that extends the Base Config Object"""
    DEBUG = False