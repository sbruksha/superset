import logging

import flask
from flask_appbuilder.security.forms import LoginForm_db
from flask_appbuilder.security.views import expose
from flask_login import login_user, logout_user
from wheel.util import as_unicode

from superset.security import SupersetSecurityManager
from flask import abort, current_app, flash, g, redirect, request, session, url_for

import jwt

logger = logging.getLogger(__name__)

# Create a custom view to authenticate the user
AuthRemoteUserView = SupersetSecurityManager.authdbview


def get_username_from_token(token):
    if token is not None:
        payload = parse_jwt_token(token)
        logger.info(payload)
        return payload['preferred_username']
    else:
        return None


def generate_jwt_token(user):
    secret = current_app.config["TOKEN_JWT_SECRET"]
    claims = {
        "username": user.username
    }
    token = jwt.encode(claims, secret)
    return token


def parse_jwt_token(token):
    secret = current_app.config["TOKEN_JWT_SECRET"]
    payload = jwt.decode(token, secret)
    return payload


class AirbnbAuthRemoteUserView(AuthRemoteUserView):
    login_template = "appbuilder/general/security/login_db.html"

    @expose("/login/", methods=["GET", "POST"])
    def login(self):
        if g.user is not None and g.user.is_authenticated:
            return redirect(self.appbuilder.get_url_for_index)
        form = LoginForm_db()
        if form.validate_on_submit():
            user = self.appbuilder.sm.auth_user_db(
                form.username.data, form.password.data
            )
            if not user:
                flash(as_unicode(self.invalid_login_message), "warning")
                return redirect(self.appbuilder.get_url_for_login)
            login_user(user, remember=False)
            next_url = request.args.get("next", "")
            if not next_url:
                next_url = self.appbuilder.get_url_for_index
            return redirect(next_url)
        return self.render_template(
            self.login_template, title=self.title, form=form, appbuilder=self.appbuilder
        )

    @expose("/auth/", methods=["POST"])
    def auth(self):
        token = flask.request.form.get('token')
        username = get_username_from_token(token)
        user = self.appbuilder.sm.find_user(username=username)
        login_user(user, remember=False)
        return flask.make_response(username)

    @expose("/auth/logout/", methods=["POST"])
    def auth_logout(self):
        token = flask.request.form.get('token')
        username = get_username_from_token(token)
        user = self.appbuilder.sm.find_user(username=username)
        logout_user()
        return flask.make_response()

    @expose("/auth/token/", methods=["POST"])
    def generate_token(self):
        username = flask.request.form.get('username')
        user = self.appbuilder.sm.find_user(username=username)
        token = generate_jwt_token(user)
        return flask.make_response(token)


class MySecurityManager(SupersetSecurityManager):
    authdbview = AirbnbAuthRemoteUserView

    def __init__(self, appbuilder):
        super(MySecurityManager, self).__init__(appbuilder)
