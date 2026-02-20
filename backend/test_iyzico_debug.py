import iyzipay
import sys
import os

# Add current directory to path so we can import app if needed, 
# but for now we'll just hardcode keys from the logs to avoid import issues
# Keys from user logs:
API_KEY = 'sandbox-Gc0atERnvDsxpWHOWSStguLcQfY0w3ue'
SECRET_KEY = 'sandbox-iW7Wfqs0XIoHu4P7swZd6qeoOmvqMKt0'

# Test cases for base_url
urls_to_test = [
    'https://sandbox-api.iyzipay.com',
    'https://sandbox-api.iyzipay.com/',
    'sandbox-api.iyzipay.com',
    'http://sandbox-api.iyzipay.com'
]

request = {
    'locale': 'tr',
    'conversationId': '123456789',
    'price': '1.0',
    'paidPrice': '1.0',
    'currency': 'TRY',
    'basketId': 'B12345',
    'paymentGroup': 'PRODUCT',
    'callbackUrl': 'https://www.merchant.com/callback',
    'buyer': {
        'id': 'BY789',
        'name': 'John',
        'surname': 'Doe',
        'gsmNumber': '+905350000000',
        'email': 'email@email.com',
        'identityNumber': '74300864791',
        'lastLoginDate': '2015-10-05 12:43:35',
        'registrationDate': '2013-04-21 15:12:09',
        'registrationAddress': 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        'ip': '85.34.78.112',
        'city': 'Istanbul',
        'country': 'Turkey',
        'zipCode': '34732'
    },
    'shippingAddress': {
        'contactName': 'Jane Doe',
        'city': 'Istanbul',
        'country': 'Turkey',
        'address': 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        'zipCode': '34742'
    },
    'billingAddress': {
        'contactName': 'Jane Doe',
        'city': 'Istanbul',
        'country': 'Turkey',
        'address': 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        'zipCode': '34742'
    },
    'basketItems': [
        {
            'id': 'BI101',
            'name': 'Binocular',
            'category1': 'Collectibles',
            'category2': 'Accessories',
            'itemType': 'PHYSICAL',
            'price': '0.3'
        },
        {
            'id': 'BI102',
            'name': 'Game code',
            'category1': 'Game',
            'category2': 'Online Game Items',
            'itemType': 'VIRTUAL',
            'price': '0.5'
        },
        {
            'id': 'BI103',
            'name': 'Usb',
            'category1': 'Electronics',
            'category2': 'Usb / Cable',
            'itemType': 'PHYSICAL',
            'price': '0.2'
        }
    ]
}

print("Testing Iyzico Connection...")

for url in urls_to_test:
    print(f"\nScanning URL: {url}")
    options = {
        'api_key': API_KEY,
        'secret_key': SECRET_KEY,
        'base_url': url
    }
    
    try:
        # We use CheckoutFormInitialize to test connection
        res = iyzipay.CheckoutFormInitialize().create(request, options)
        print(f"Result Type: {type(res)}")
        try:
            status = res.get_status()
            print(f"Status: {status}")
            if status == 'failure':
                 print(f"Error Message: {res.get_error_message()}")
        except AttributeError:
             print("AttributeError: object has no get_status()")
             print(f"Raw Object: {res}")
             if hasattr(res, 'status'):
                 print(f"HTTP Status: {res.status}")
             if hasattr(res, 'read'):
                 print(f"HTTP Body: {res.read()}")
             
    except Exception as e:
        print(f"Exception: {e}")
