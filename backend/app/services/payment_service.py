import iyzipay
from typing import Dict, Any
from uuid import UUID
from app.core.config import settings
import base64
import json

class PaymentService:
    """
    Service for handling payments via Iyzico.
    """
    
    def __init__(self):
        self.options = {
            'api_key': settings.IYZICO_API_KEY,
            'secret_key': settings.IYZICO_SECRET_KEY,
            'base_url': settings.IYZICO_BASE_URL.replace("https://", "").replace("http://", "")
        }

    def initialize_payment(self, order_id: UUID, price: float, user_info: Dict[str, Any], shipping_address: Dict[str, Any], items: list) -> str:
        """
        Initialize a payment session with Iyzico Checkout Form.
        """
        if not self.options['api_key'] or not self.options['secret_key']:
            raise Exception("Iyzico API keys are not configured.")

        # Ensure price formatting is correct
        formatted_price = "{:.2f}".format(price)
        
        # Prepare basket items
        # To avoid price mismatch issues, we will send one aggregate item representing the entire order.
        # This guarantees that the sum of basket items equals the total price.
        basket_items = [
            {
                'id': str(order_id),
                'name': f"Order {order_id}",
                'category1': 'General',
                'category2': 'General',
                'itemType': 'PHYSICAL',
                'price': formatted_price
            }
        ]

        request = {
            'locale': 'tr',
            'conversationId': str(order_id),
            'price': formatted_price,
            'paidPrice': formatted_price,
            'currency': 'TRY',
            'basketId': str(order_id),
            'paymentGroup': 'PRODUCT',
            'callbackUrl': f"http://localhost:8000/api/payment/callback", # Backend handles this callback
            # 'enabledInstallments': ['2', '3', '6', '9'],
            'buyer': {
                'id': user_info.get("id"),
                'name': user_info.get("first_name", "Guest"),
                'surname': user_info.get("last_name", "User"),
                'gsmNumber': user_info.get("phone", "+905000000000"),
                'email': user_info.get("email"),
                'identityNumber': '11111111111', # Required by Iyzico, using dummy for dev
                'lastLoginDate': '2015-10-05 12:43:35',
                'registrationDate': '2013-04-21 15:12:09',
                'registrationAddress': 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
                'ip': '85.34.78.112',
                'city': 'Istanbul',
                'country': 'Turkey',
                'zipCode': '34732'
            },
            'shippingAddress': {
                'contactName': shipping_address.get("full_name", "Jane Doe"),
                'city': shipping_address.get("city", "Istanbul"),
                'country': shipping_address.get("country", "Turkey"),
                'address': shipping_address.get("address", "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1"),
                'zipCode': shipping_address.get("postal_code", "34742")
            },
            'billingAddress': {
                'contactName': shipping_address.get("full_name", "Jane Doe"),
                'city': shipping_address.get("city", "Istanbul"),
                'country': shipping_address.get("country", "Turkey"),
                'address': shipping_address.get("address", "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1"),
                'zipCode': shipping_address.get("postal_code", "34742")
            },
            'basketItems': basket_items
        }
        
        # Initialize Checkout Form
        try:
            print(f"Initializing payment with options: {self.options}")
            print(f"Request: {request}")
            checkout_form_initialize = iyzipay.CheckoutFormInitialize().create(request, self.options)
            
            # Handle raw HTTPResponse (SDK quirk)
            if hasattr(checkout_form_initialize, 'read'):
                response_str = checkout_form_initialize.read().decode('utf-8')
                response_data = json.loads(response_str)
                
                print(f"Iyzico Raw Response: {response_data}")
                
                if response_data.get("status") == "success":
                    return response_data.get("checkoutFormContent")
                else:
                    error_message = response_data.get("errorMessage", "Unknown error")
                    raise Exception(f"Iyzico Error: {error_message}")

            # Standard SDK behavior
            print(f"Iyzico Status: {checkout_form_initialize.get_status()}")
            print(f"Iyzico Error: {checkout_form_initialize.get_error_message()}")
            
            if checkout_form_initialize.get_status() == "success":
                return checkout_form_initialize.get_checkout_form_content() # This returns HTML/Script
            else:
                error_message = checkout_form_initialize.get_error_message()
                raise Exception(f"Iyzico Error: {error_message}")
        except Exception as e:
            print(f"Payment Initialization Exception: {str(e)}")
            raise e

    def verify_payment(self, token: str) -> Dict[str, Any]:
        """
        Verify the payment result using the token.
        """
        request = {
            'locale': 'tr',
            'token': token
        }
        
        checkout_form_result = iyzipay.CheckoutForm().retrieve(request, self.options)
        
        # Handle raw HTTPResponse (SDK quirk)
        if hasattr(checkout_form_result, 'read'):
            response_str = checkout_form_result.read().decode('utf-8')
            response_data = json.loads(response_str)
            
            print(f"Iyzico Verify Raw Response: {response_data}")
            
            result = {
                "status": response_data.get("status"),
                "paymentStatus": response_data.get("paymentStatus"),
                "paymentId": response_data.get("paymentId"),
                "basketId": response_data.get("basketId"),
                "errorMessage": response_data.get("errorMessage"),
                "conversationId": response_data.get("conversationId")
            }
            return result

        result = {
            "status": checkout_form_result.get_status(),
            "paymentStatus": checkout_form_result.get_payment_status(),
            "paymentId": checkout_form_result.get_payment_id(),
            "basketId": checkout_form_result.get_basket_id(),
            "errorMessage": checkout_form_result.get_error_message(),
            "conversationId": checkout_form_result.get_conversation_id()
        }
        
        return result

# Global instance
payment_service = PaymentService()
