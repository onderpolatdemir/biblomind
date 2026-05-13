from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

# Shared properties
class AddressBase(BaseModel):
    name: str
    street: str
    city: str
    state: str
    postal_code: str
    country: Optional[str] = "Turkey"

# Properties to receive via API on creation
class AddressCreate(AddressBase):
    pass

# Properties to receive via API on update
class AddressUpdate(AddressBase):
    name: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

# Properties shared by models stored in DB
class AddressInDBBase(AddressBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Additional properties to return via API
class Address(AddressInDBBase):
    pass
