from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api import deps
from app.models.address import Address
from app.models.user import User
from app.schemas import address as schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Address])
def read_addresses(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve user addresses.
    """
    query = select(Address).where(Address.user_id == current_user.id).offset(skip).limit(limit)
    addresses = db.execute(query).scalars().all()
    return addresses

@router.post("/", response_model=schemas.Address)
def create_address(
    address_in: schemas.AddressCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new address.
    """
    address = Address(
        **address_in.model_dump(),
        user_id=current_user.id
    )
    db.add(address)
    db.commit()
    db.refresh(address)
    return address

@router.put("/{address_id}", response_model=schemas.Address)
def update_address(
    address_id: UUID,
    address_in: schemas.AddressUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update an address.
    """
    query = select(Address).where(
        Address.id == address_id,
        Address.user_id == current_user.id
    )
    address = db.execute(query).scalars().first()
    
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )
        
    update_data = address_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(address, field, value)
        
    db.add(address)
    db.commit()
    db.refresh(address)
    return address

@router.delete("/{address_id}", response_model=schemas.Address)
def delete_address(
    address_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete an address.
    """
    query = select(Address).where(
        Address.id == address_id,
        Address.user_id == current_user.id
    )
    address = db.execute(query).scalars().first()
    
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )
        
    db.delete(address)
    db.commit()
    return address
