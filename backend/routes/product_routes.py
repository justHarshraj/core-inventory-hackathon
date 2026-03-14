from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from dependencies import get_db

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("/categories", response_model=schemas.CategoryResponse)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    if db.query(models.Category).filter(models.Category.name == category.name).first():
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    db_cat = models.Category(name=category.name, description=category.description)
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.get("/categories", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@router.put("/categories/{category_id}", response_model=schemas.CategoryResponse)
def update_category(category_id: int, category_update: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    for key, value in category_update.dict().items():
        setattr(db_cat, key, value)
    
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    db_cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if products are linked
    product_count = db.query(models.Product).filter(models.Product.category_id == category_id).count()
    if product_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete category with linked products.")
    
    db.delete(db_cat)
    db.commit()
    return {"message": "Category deleted successfully"}

@router.post("/", response_model=schemas.ProductResponse)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    if db.query(models.Product).filter(models.Product.sku == product.sku).first():
        raise HTTPException(status_code=400, detail="Product with this SKU already exists")
    db_prod = models.Product(**product.dict())
    db.add(db_prod)
    db.commit()
    db.refresh(db_prod)
    return db_prod

@router.get("/", response_model=List[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    products = db.query(models.Product).all()
    
    # Calculate on-hand and free-to-use for each product
    for prod in products:
        # Sum quantities in INTERNAL locations
        internal_stock = db.query(models.StockQuant).join(models.Location).filter(
            models.StockQuant.product_id == prod.id,
            models.Location.type == models.LocationType.INTERNAL
        ).all()
        
        on_hand = sum(quant.quantity for quant in internal_stock)
        
        # Breakdown
        prod.stock_breakdown = [
            {"location_name": quant.location.name, "quantity": quant.quantity}
            for quant in internal_stock if quant.quantity != 0
        ]
        
        # Calculate outgoing stock (pending delivery moves not yet done)
        outgoing_moves = db.query(models.StockMove).join(
            models.StockPicking
        ).filter(
            models.StockMove.product_id == prod.id,
            models.StockPicking.type == models.PickingType.DELIVERY,
            models.StockMove.status.in_([models.PickingStatus.DRAFT, models.PickingStatus.WAITING, models.PickingStatus.READY])
        ).all()
        
        outgoing_quantity = sum(move.quantity for move in outgoing_moves)
        free_to_use = on_hand - outgoing_quantity
        
        prod.on_hand = on_hand
        prod.free_to_use = free_to_use
        
    return products

class QuickAdjustRequest(schemas.BaseModel):
    quantity: float

@router.post("/{product_id}/adjust", response_model=schemas.ProductResponse)
def adjust_product_stock(product_id: int, adjust_req: QuickAdjustRequest, db: Session = Depends(get_db)):
    prod = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    # Find a primary INTERNAL location to adjust. If none exists, we error out politely.
    loc = db.query(models.Location).filter(models.Location.type == models.LocationType.INTERNAL).first()
    if not loc:
        raise HTTPException(status_code=400, detail="No internal location found to adjust stock.")
        
    quant = db.query(models.StockQuant).filter(
        models.StockQuant.product_id == product_id,
        models.StockQuant.location_id == loc.id
    ).first()

    if quant:
        quant.quantity = adjust_req.quantity
    else:
        new_quant = models.StockQuant(
            product_id=product_id,
            location_id=loc.id,
            quantity=adjust_req.quantity
        )
        db.add(new_quant)

    db.commit()
    
    # We just return the list GET flow to get the recalculated fields cheaply for this one record
    return get_products(db)[0]  # This is slightly inefficient but fine for this scope
@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product_update: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_prod = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product_update.dict().items():
        setattr(db_prod, key, value)
    
    db.commit()
    db.refresh(db_prod)
    return db_prod

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_prod = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Delete associated records to allow full deletion
    db.query(models.StockMove).filter(models.StockMove.product_id == product_id).delete(synchronize_session=False)
    db.query(models.StockAdjustmentLine).filter(models.StockAdjustmentLine.product_id == product_id).delete(synchronize_session=False)
    db.query(models.StockQuant).filter(models.StockQuant.product_id == product_id).delete(synchronize_session=False)
    
    db.delete(db_prod)
    db.commit()
    return {"message": "Product deleted successfully"}
