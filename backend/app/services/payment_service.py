from typing import Dict, Any, Optional
from uuid import UUID

class PaymentService:
    """
    Service for handling payments via Iyzico (Mock implementation).
    """
    
    def __init__(self):
        # In a real implementation, we would initialize Iyzico client here with API keys
        pass

    def initialize_payment(self, order_id: UUID, price: float, user_info: Dict[str, Any], shipping_address: Dict[str, Any]) -> str:
        """
        Initialize a payment session with Iyzico.
        Returns the HTML content or iframe URL to be displayed on frontend.
        
        For this mock: Returns a dummy iframe URL
        """
        conversation_id = str(order_id)
        
        # Mock Iyzico response
        # checking if price is valid just to simulate logic
        if price <= 0:
            raise ValueError("Invalid price for payment initialization")
            
        # Generates a mock payment page URL (in real app, this comes from Iyzico)
        return f"https://sandbox-payment-page.iyzico.com/payment/{conversation_id}"

    def verify_payment(self, token: str) -> Dict[str, Any]:
        """
        Verify the payment result using the token returned from Iyzico callback.
        """
        # Mock verification logic
        # In reality, we call Iyzico API with this token to check status
        
        if token == "mock_fail_token":
            return {
                "status": "failure",
                "paymentStatus": "FAILURE",
                "errorMessage": "Mock payment failure"
            }
            
        return {
            "status": "success",
            "paymentStatus": "SUCCESS",
            "paymentId": "123456",
            "conversationId": "mock_conversation_id"
        }

# Global instance
payment_service = PaymentService()
