from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel

class PaymentInitializeRequest(BaseModel):
    order_id: UUID

class PaymentInitializeResponse(BaseModel):
    payment_page_url: str
    conversation_id: str

class PaymentCallbackRequest(BaseModel):
    token: str

class PaymentStatusResponse(BaseModel):
    status: str
    conversation_id: Optional[str] = None
    payment_id: Optional[str] = None
    error_message: Optional[str] = None
