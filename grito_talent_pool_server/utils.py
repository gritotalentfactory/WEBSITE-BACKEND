from datetime import datetime
import re
from django.core.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework import status, serializers
from django.http import JsonResponse
from django.conf import settings

"""
NB: The debug settings need to be set to False for this to work
"""


class generateKey:
    @staticmethod
    def return_value(phone):
        return f"{phone}{datetime.date(datetime.now())}{settings.SECRET_KEY}"


def error_500(request):
    message = "An error occurred"
    print(request)
    # send_mail to developer to handle error
    response = JsonResponse(data={"message": message, "status_code": 404})
    response.status_code = 500
    return response


def error_401(message):
    return Response(
        {
            "code": status.HTTP_401_UNAUTHORIZED,
            "status": "error",
            "message": message,
        },
        status=status.HTTP_401_UNAUTHORIZED,
    )


def error_400(message):
    return Response(
        {
            "code": status.HTTP_400_BAD_REQUEST,
            "status": "error",
            "message": message,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


def error_404(message):
    return Response(
        {
            "code": status.HTTP_404_NOT_FOUND,
            "status": "error",
            "message": message,
        },
        status=status.HTTP_404_NOT_FOUND,
    )


def error_406(message):
    return Response(
        {
            "code": status.HTTP_406_NOT_ACCEPTABLE,
            "status": "error",
            "message": message,
        },
        status=status.HTTP_406_NOT_ACCEPTABLE,
    )


def serializer_error_400(message):
    return serializers.ValidationError(
        {"code": 400, "status": "error", "message": message}
    )


def error_response(message, status_code):
    return Response(
        {"message": message},
        status=status_code,
    )


def serializer_errors(default_errors):
    error_messages = ""
    for field_name, field_errors in default_errors.items():
        if field_errors[0].code == "unique":
            error_messages += f"{field_name} already exists"
        else:
            error_messages += f"{field_name} is {field_errors[0].code}"

    return error_messages


def format_phone_number(phone_number):
    if not phone_number or len(phone_number) < 2:
        return None

    if len(phone_number) > 2 and phone_number[0] == "+":
        return phone_number[1:]

    elif len(phone_number) > 2 and phone_number[:3] == "234":
        return phone_number

    elif len(phone_number) > 2 and phone_number[:3] != "234" and phone_number[0] != "+":
        return f"234{phone_number[1:]}"


def validate_phone(value):
    pattern = re.compile(r"^\+?1?\d{9,15}$")
    if not bool(pattern.match(value)):
        raise ValidationError(
            (
                "Invalid! Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
            ),
            params={"value": value},
        )


def custom_normalize_email(email):
    return email.strip().lower()
