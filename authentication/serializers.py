import base64

from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from decouple import config
import pyotp
from django.conf import settings
from grito_talent_pool_server.utils import custom_normalize_email, generateKey
from .mixins import OTPVerificationMixin
from .models import User


class SuperAdminRegistrationSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True)
    user_type = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = "__all__"

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user
        password = validated_data.pop("password")
        email = validated_data["email"]
        email = custom_normalize_email(email)

        try:
            existing_user = User.objects.get(email=email)
        except User.DoesNotExist:
            existing_user = None

        if not existing_user:
            mem = User.objects.create(**validated_data)

            mem.set_password(password)
            group, _ = Group.objects.get_or_create(name="super-admin")
            mem.is_verified = False
            mem.is_active = True
            mem.user_type = "super-admin"
            mem.created_by = user.id
            mem.save()
            mem.groups.add(group)

        else:
            raise serializers.ValidationError(
                {"code": 400, "status": "error", "message": "Admin user already exists"}
            )

        return validated_data


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True)


class UserUpdateVerifiedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # fields = ('__all__')
        exclude = (
            "is_active",
            "password",
            "is_superuser",
            "user_permissions",
            "groups",
        )


class ResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def save(self, user):
        password_1 = self.validated_data["password"]
        password_2 = self.validated_data["confirm_password"]

        if password_1 == password_2:
            user.set_password(password_1)
            user.is_email_verified = True
            user.save()

            return self.get_name(user)

    @staticmethod
    def get_name(user_data):
        name = ''
        if user_data.user_type == 'customer':
            name = user_data.first_name + ' ' + user_data.last_name
        elif user_data.user_type == 'business':
            name = user_data.business_name
        elif user_data.user_type == 'super-admin':
            name = user_data.first_name + ' ' + '(Admin)'

        return name


class EmailandPhoneNumberSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)


class OTPVerificationSerializer(serializers.Serializer):
    otp_code = serializers.CharField(required=True)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False)

    @staticmethod
    def get_name(user_data):
        name = ''
        if user_data.user_type == 'customer':
            name = user_data.first_name + ' ' + user_data.last_name
        elif user_data.user_type == 'business':
            name = user_data.business_name
        elif user_data.user_type == 'super-admin':
            name = user_data.first_name + ' ' + '(Admin)'

        return name

    def validate(self, data):
        otp_code = data["otp_code"]
        email = data.get("email", None)
        phone = data.get("phone", None)

        if not email and not phone:
            raise ValidationError("Either email or phone must be provided")

        user = None
        user_mode = None

        if email:
            user_mode = "email"
            user = User.objects.filter(email=email).first()
        elif phone:
            user_mode = "phone"
            user = User.objects.filter(phone=phone).first()

        if not user:
            raise ValidationError(f"User with the provided {user_mode} does not exist")

        otp_mixin = OTPVerificationMixin()
        verified_user = otp_mixin.verify_otp(user, otp_code, user_mode)

        return {
            "user": verified_user,
            "user_mode": user_mode,
            'name': self.get_name(verified_user)
        }


class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            User.objects.get(email=value, is_active=True)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")

    def resend_otp(self):
        email = self.validated_data["email"]
        user = User.objects.get(email=email)
        self.send_otp_email(email, user.first_name)

    def send_otp_email(self, email, name):
        key = self.generate_key(email)
        OTP = pyotp.TOTP(key, interval=settings.OTP_TIMEOUT)
        otp_code = OTP.now()
        # send_otp_email(email, otp_code, name)

    @staticmethod
    def generate_key(email):
        keygen = generateKey()
        key_bytes = keygen.return_value(email).encode()
        key_base32 = base64.b32encode(key_bytes).decode('utf-8')
        return key_base32
