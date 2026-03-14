from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    STAFF = "Staff"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    login_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    sku = Column(String, unique=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    unit_of_measure = Column(String, default="Units")
    reorder_rule = Column(Float, default=0.0)
    cost = Column(Float, default=0.0)

    category = relationship("Category")

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    short_code = Column(String, index=True, nullable=True)
    address = Column(String, nullable=True)

class LocationType(str, enum.Enum):
    INTERNAL = "Internal"
    VENDOR = "Vendor"
    CUSTOMER = "Customer"
    LOSS = "Inventory Loss"

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    short_code = Column(String, index=True, nullable=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    type = Column(Enum(LocationType), default=LocationType.INTERNAL)

    warehouse = relationship("Warehouse")

class StockQuant(Base):
    __tablename__ = "stock_quants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    location_id = Column(Integer, ForeignKey("locations.id"))
    quantity = Column(Float, default=0.0)

    product = relationship("Product")
    location = relationship("Location")

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

class StockPicking(Base):
    __tablename__ = "stock_pickings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # Reference like WH/IN/0001
    location_id = Column(Integer, ForeignKey("locations.id"))
    location_dest_id = Column(Integer, ForeignKey("locations.id"))
    status = Column(Enum(PickingStatus), default=PickingStatus.DRAFT)
    type = Column(Enum(PickingType))
    scheduled_date = Column(DateTime, default=datetime.datetime.utcnow)

    location = relationship("Location", foreign_keys=[location_id])
    location_dest = relationship("Location", foreign_keys=[location_dest_id])
    moves = relationship("StockMove", back_populates="picking")

class StockMove(Base):
    __tablename__ = "stock_moves"

    id = Column(Integer, primary_key=True, index=True)
    picking_id = Column(Integer, ForeignKey("stock_pickings.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    location_id = Column(Integer, ForeignKey("locations.id"))
    location_dest_id = Column(Integer, ForeignKey("locations.id"))
    quantity = Column(Float, default=0.0)
    status = Column(Enum(PickingStatus), default=PickingStatus.DRAFT)

    picking = relationship("StockPicking", back_populates="moves")
    product = relationship("Product")
    location = relationship("Location", foreign_keys=[location_id])
    location_dest = relationship("Location", foreign_keys=[location_dest_id])

class StockAdjustment(Base):
    __tablename__ = "stock_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(Enum(PickingStatus), default=PickingStatus.DRAFT) # usually Draft / Done

class StockAdjustmentLine(Base):
    __tablename__ = "stock_adjustment_lines"

    id = Column(Integer, primary_key=True, index=True)
    adjustment_id = Column(Integer, ForeignKey("stock_adjustments.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    location_id = Column(Integer, ForeignKey("locations.id"))
    theoretical_quantity = Column(Float, default=0.0)
    counted_quantity = Column(Float, default=0.0)

    adjustment = relationship("StockAdjustment")
    product = relationship("Product")
    location = relationship("Location")
