from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import enum

class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    STAFF = "Staff"

class UserCreate(BaseModel):
    login_id: str
    email: str
    password: str

class UserLogin(BaseModel):
    login_id: str
    password: str

class UserResponse(BaseModel):
    id: int
    login_id: str
    email: str

    class Config:
        from_attributes = True

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str
    sku: str
    category_id: int
    unit_of_measure: Optional[str] = "Units"
    reorder_rule: Optional[float] = 0.0
    cost: Optional[float] = 0.0

class StockBreakdown(BaseModel):
    location_name: str
    quantity: float

class ProductResponse(BaseModel):
    id: int
    name: str
    sku: str
    category_id: int
    unit_of_measure: str
    reorder_rule: float
    cost: float
    on_hand: Optional[float] = 0.0
    free_to_use: Optional[float] = 0.0
    category: Optional[CategoryResponse]
    stock_breakdown: List[StockBreakdown] = []

    class Config:
        from_attributes = True

class WarehouseCreate(BaseModel):
    name: str
    short_code: Optional[str] = None
    address: Optional[str] = None

class WarehouseResponse(BaseModel):
    id: int
    name: str
    short_code: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True

class LocationType(str, enum.Enum):
    INTERNAL = "Internal"
    VENDOR = "Vendor"
    CUSTOMER = "Customer"
    LOSS = "Inventory Loss"

class LocationCreate(BaseModel):
    name: str
    short_code: Optional[str] = None
    warehouse_id: Optional[int] = None
    type: LocationType = LocationType.INTERNAL

class LocationResponse(BaseModel):
    id: int
    name: str
    short_code: Optional[str] = None
    warehouse_id: Optional[int]
    type: LocationType

    class Config:
        from_attributes = True

class StockQuantResponse(BaseModel):
    id: int
    product_id: int
    location_id: int
    quantity: float
    product: Optional[ProductResponse]
    location: Optional[LocationResponse]

    class Config:
        from_attributes = True

class PickingType(str, enum.Enum):
    RECEIPT = "Receipt"
    DELIVERY = "Delivery"
    INTERNAL = "Internal"

class PickingStatus(str, enum.Enum):
    DRAFT = "Draft"
    WAITING = "Waiting"
    READY = "Ready"
    DONE = "Done"
    CANCELLED = "Cancelled"

class StockMoveCreate(BaseModel):
    product_id: int
    quantity: float

class StockPickingCreate(BaseModel):
    location_id: int
    location_dest_id: int
    type: PickingType
    scheduled_date: Optional[datetime] = None
    moves: List[StockMoveCreate]

class StockMoveResponse(BaseModel):
    id: int
    picking_id: Optional[int]
    product_id: int
    location_id: int
    location_dest_id: int
    quantity: float
    status: PickingStatus
    product: Optional[ProductResponse]

    class Config:
        from_attributes = True

class StockPickingResponse(BaseModel):
    id: int
    name: str
    location_id: int
    location_dest_id: int
    status: PickingStatus
    type: PickingType
    scheduled_date: datetime
    moves: List[StockMoveResponse] = []

    class Config:
        from_attributes = True

class StockAdjustmentLineCreate(BaseModel):
    product_id: int
    location_id: int
    counted_quantity: float

class StockAdjustmentCreate(BaseModel):
    lines: List[StockAdjustmentLineCreate]

class StockAdjustmentLineResponse(BaseModel):
    id: int
    adjustment_id: int
    product_id: int
    location_id: int
    theoretical_quantity: float
    counted_quantity: float
    product: Optional[ProductResponse]
    location: Optional[LocationResponse]

    class Config:
        from_attributes = True

class StockAdjustmentResponse(BaseModel):
    id: int
    date: datetime
    status: PickingStatus

    class Config:
        from_attributes = True
