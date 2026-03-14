from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from dependencies import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

import datetime

@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db)):
    today = datetime.datetime.utcnow()

    # --- Product KPIs ---
    total_products = db.query(models.Product).count()
    
    # Calculate on-hand for each product to determine low stock / out of stock
    products = db.query(models.Product).all()
    low_stock = 0
    out_of_stock = 0
    for prod in products:
        internal_stock = db.query(models.StockQuant).join(models.Location).filter(
            models.StockQuant.product_id == prod.id,
            models.Location.type == models.LocationType.INTERNAL
        ).all()
        on_hand = sum(q.quantity for q in internal_stock)
        if on_hand <= 0:
            out_of_stock += 1
        elif prod.reorder_rule > 0 and on_hand <= prod.reorder_rule:
            low_stock += 1

    # --- Picking KPIs ---
    def analyze_pickings(ptype):
        pickings = db.query(models.StockPicking).filter(
            models.StockPicking.type == ptype,
            models.StockPicking.status.notin_([models.PickingStatus.DONE, models.PickingStatus.CANCELLED])
        ).all()
        
        late = 0
        operations = 0
        waiting = 0
        ready = 0
        total = len(pickings)
        
        for p in pickings:
            if p.scheduled_date and p.scheduled_date.date() < today.date():
                late += 1
            if p.scheduled_date and p.scheduled_date.date() >= today.date():
                operations += 1
                
            if p.status == models.PickingStatus.WAITING:
                waiting += 1
            elif p.status in [models.PickingStatus.READY, models.PickingStatus.DRAFT]:
                ready += 1
                
        return {"late": late, "operations": operations, "waiting": waiting, "ready": ready, "total": total}

    receipts_data = analyze_pickings(models.PickingType.RECEIPT)
    deliveries_data = analyze_pickings(models.PickingType.DELIVERY)
    internals_data = analyze_pickings(models.PickingType.INTERNAL)

    return {
        "total_products": total_products,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "receipts": receipts_data,
        "deliveries": deliveries_data,
        "internal_transfers": internals_data
    }
