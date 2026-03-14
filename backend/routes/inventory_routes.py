from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from dependencies import get_db

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.post("/warehouses", response_model=schemas.WarehouseResponse)
def create_warehouse(wh: schemas.WarehouseCreate, db: Session = Depends(get_db)):
    if db.query(models.Warehouse).filter(models.Warehouse.name == wh.name).first():
        raise HTTPException(status_code=400, detail="Warehouse with this name already exists")
    db_wh = models.Warehouse(name=wh.name, short_code=wh.short_code, address=wh.address)
    db.add(db_wh)
    db.commit()
    db.refresh(db_wh)
    return db_wh

@router.get("/warehouses", response_model=List[schemas.WarehouseResponse])
def get_warehouses(db: Session = Depends(get_db)):
    return db.query(models.Warehouse).all()

@router.post("/locations", response_model=schemas.LocationResponse)
def create_location(loc: schemas.LocationCreate, db: Session = Depends(get_db)):
    db_loc = models.Location(**loc.dict())
    db.add(db_loc)
    db.commit()
    db.refresh(db_loc)
    return db_loc

@router.get("/locations", response_model=List[schemas.LocationResponse])
def get_locations(db: Session = Depends(get_db)):
    return db.query(models.Location).all()

@router.put("/warehouses/{wh_id}", response_model=schemas.WarehouseResponse)
def update_warehouse(wh_id: int, wh_update: schemas.WarehouseCreate, db: Session = Depends(get_db)):
    db_wh = db.query(models.Warehouse).filter(models.Warehouse.id == wh_id).first()
    if not db_wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    for key, value in wh_update.dict().items():
        setattr(db_wh, key, value)
    db.commit()
    db.refresh(db_wh)
    return db_wh

@router.delete("/warehouses/{wh_id}")
def delete_warehouse(wh_id: int, db: Session = Depends(get_db)):
    db_wh = db.query(models.Warehouse).filter(models.Warehouse.id == wh_id).first()
    if not db_wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    # Check for locations tied to this warehouse
    loc_count = db.query(models.Location).filter(models.Location.warehouse_id == wh_id).count()
    if loc_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete warehouse with existing locations.")
    db.delete(db_wh)
    db.commit()
    return {"message": "Warehouse deleted successfully"}

@router.put("/locations/{loc_id}", response_model=schemas.LocationResponse)
def update_location(loc_id: int, loc_update: schemas.LocationCreate, db: Session = Depends(get_db)):
    db_loc = db.query(models.Location).filter(models.Location.id == loc_id).first()
    if not db_loc:
        raise HTTPException(status_code=404, detail="Location not found")
    for key, value in loc_update.dict().items():
        setattr(db_loc, key, value)
    db.commit()
    db.refresh(db_loc)
    return db_loc

@router.delete("/locations/{loc_id}")
def delete_location(loc_id: int, db: Session = Depends(get_db)):
    db_loc = db.query(models.Location).filter(models.Location.id == loc_id).first()
    if not db_loc:
        raise HTTPException(status_code=404, detail="Location not found")
    # Check for stock quants or moves
    quant_count = db.query(models.StockQuant).filter(models.StockQuant.location_id == loc_id).count()
    if quant_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete location with existing stock.")
    move_count = db.query(models.StockMove).filter((models.StockMove.location_id == loc_id) | (models.StockMove.location_dest_id == loc_id)).count()
    if move_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete location with movement history.")
    db.delete(db_loc)
    db.commit()
    return {"message": "Location deleted successfully"}

@router.post("/picking", response_model=schemas.StockPickingResponse)
def create_picking(picking: schemas.StockPickingCreate, db: Session = Depends(get_db)):
    picking_type_str = picking.type.value[:2].upper() if picking.type else "IN"
    
    warehouse_code = "WH"
    if picking.type.value == "Receipt":
        wh = db.query(models.Warehouse).join(models.Location).filter(models.Location.id == picking.location_dest_id).first()
        if wh and wh.short_code:
            warehouse_code = wh.short_code
    elif picking.type.value == "Delivery":
        wh = db.query(models.Warehouse).join(models.Location).filter(models.Location.id == picking.location_id).first()
        if wh and wh.short_code:
            warehouse_code = wh.short_code

    count = db.query(models.StockPicking).count() + 1
    
    db_picking = models.StockPicking(
        name=f"{warehouse_code}/{picking_type_str}/00{count}",
        location_id=picking.location_id,
        location_dest_id=picking.location_dest_id,
        type=picking.type,
        scheduled_date=picking.scheduled_date,
        status=models.PickingStatus.DRAFT
    )
    db.add(db_picking)
    db.flush()

    for move in picking.moves:
        db_move = models.StockMove(
            picking_id=db_picking.id,
            product_id=move.product_id,
            location_id=picking.location_id,
            location_dest_id=picking.location_dest_id,
            quantity=move.quantity
        )
        db.add(db_move)

    db.commit()
    db.refresh(db_picking)
    return db_picking

@router.put("/picking/{picking_id}/status")
def update_picking_status(picking_id: int, status: schemas.PickingStatus, db: Session = Depends(get_db)):
    picking = db.query(models.StockPicking).filter(models.StockPicking.id == picking_id).first()
    if not picking:
        raise HTTPException(status_code=404, detail="Picking not found")
    
    picking.status = status
    db.commit()
    db.refresh(picking)
    return picking

@router.post("/picking/{picking_id}/validate")
def validate_picking(picking_id: int, db: Session = Depends(get_db)):
    picking = db.query(models.StockPicking).filter(models.StockPicking.id == picking_id).first()
    if not picking:
        raise HTTPException(status_code=404, detail="Picking not found")
    
    if picking.status == models.PickingStatus.DONE:
        raise HTTPException(status_code=400, detail="Already validated")

    moves = db.query(models.StockMove).filter(models.StockMove.picking_id == picking_id).all()
    
    for move in moves:
        if move.location_id:
            src_loc = db.query(models.Location).filter(models.Location.id == move.location_id).first()
            if src_loc and src_loc.type == models.LocationType.INTERNAL:
                quant_src = db.query(models.StockQuant).filter_by(
                    product_id=move.product_id, location_id=move.location_id).first()
                available = quant_src.quantity if quant_src else 0
                if available < move.quantity:
                    product_name = move.product.name if move.product else f"Product #{move.product_id}"
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Insufficient stock for {product_name} at {src_loc.name}. Available: {available}, Required: {move.quantity}"
                    )

            quant_src = db.query(models.StockQuant).filter_by(
                product_id=move.product_id, location_id=move.location_id).first()
            if not quant_src:
                quant_src = models.StockQuant(
                    product_id=move.product_id, location_id=move.location_id, quantity=0)
                db.add(quant_src)
            quant_src.quantity -= move.quantity

        if move.location_dest_id:
            quant_dest = db.query(models.StockQuant).filter_by(
                product_id=move.product_id, location_id=move.location_dest_id).first()
            if not quant_dest:
                quant_dest = models.StockQuant(
                    product_id=move.product_id, location_id=move.location_dest_id, quantity=0)
                db.add(quant_dest)
            quant_dest.quantity += move.quantity
        
        move.status = models.PickingStatus.DONE

    picking.status = models.PickingStatus.DONE
    db.commit()
    return {"message": "Validated successfully"}

@router.get("/stock", response_model=List[schemas.StockQuantResponse])
def get_stock(db: Session = Depends(get_db)):
    return db.query(models.StockQuant).all()

@router.post("/picking/{picking_id}/add-move")
def add_move_to_picking(picking_id: int, move: schemas.StockMoveCreate, db: Session = Depends(get_db)):
    picking = db.query(models.StockPicking).filter(models.StockPicking.id == picking_id).first()
    if not picking:
        raise HTTPException(status_code=404, detail="Picking not found")
    if picking.status == models.PickingStatus.DONE:
        raise HTTPException(status_code=400, detail="Cannot add moves to a completed picking")
    
    db_move = models.StockMove(
        picking_id=picking.id,
        product_id=move.product_id,
        location_id=picking.location_id,
        location_dest_id=picking.location_dest_id,
        quantity=move.quantity
    )
    db.add(db_move)
    db.commit()
    return {"message": "Move added successfully"}

@router.get("/picking", response_model=List[schemas.StockPickingResponse])
def get_pickings(db: Session = Depends(get_db)):
    return db.query(models.StockPicking).all()

@router.delete("/picking/history")
def clear_picking_history(db: Session = Depends(get_db)):
    # Delete moves first due to foreign key constraints
    # We only delete history (Done or Cancelled)
    pickings_to_delete = db.query(models.StockPicking.id).filter(
        models.StockPicking.status.in_([models.PickingStatus.DONE, models.PickingStatus.CANCELLED])
    ).all()
    picking_ids = [p.id for p in pickings_to_delete]
    
    if picking_ids:
        db.query(models.StockMove).filter(models.StockMove.picking_id.in_(picking_ids)).delete(synchronize_session=False)
        db.query(models.StockPicking).filter(models.StockPicking.id.in_(picking_ids)).delete(synchronize_session=False)
        db.commit()
    
    return {"message": f"Deleted {len(picking_ids)} historical operations."}

# --- Stock Adjustments ---

@router.post("/adjustments")
def create_adjustment(adj: schemas.StockAdjustmentCreate, db: Session = Depends(get_db)):
    db_adj = models.StockAdjustment(status=models.PickingStatus.DRAFT)
    db.add(db_adj)
    db.flush()

    for line in adj.lines:
        # Get the theoretical (current) stock for this product at this location
        quant = db.query(models.StockQuant).filter_by(
            product_id=line.product_id, location_id=line.location_id
        ).first()
        theoretical = quant.quantity if quant else 0.0

        db_line = models.StockAdjustmentLine(
            adjustment_id=db_adj.id,
            product_id=line.product_id,
            location_id=line.location_id,
            theoretical_quantity=theoretical,
            counted_quantity=line.counted_quantity
        )
        db.add(db_line)

    db.commit()
    db.refresh(db_adj)
    return {"id": db_adj.id, "status": db_adj.status.value, "message": "Adjustment created"}

@router.get("/adjustments")
def get_adjustments(db: Session = Depends(get_db)):
    adjustments = db.query(models.StockAdjustment).order_by(models.StockAdjustment.id.desc()).all()
    result = []
    for adj in adjustments:
        lines = db.query(models.StockAdjustmentLine).filter_by(adjustment_id=adj.id).all()
        line_data = []
        for l in lines:
            prod = db.query(models.Product).filter_by(id=l.product_id).first()
            loc = db.query(models.Location).filter_by(id=l.location_id).first()
            line_data.append({
                "id": l.id,
                "product_id": l.product_id,
                "product_name": prod.name if prod else "Unknown",
                "product_sku": prod.sku if prod else "",
                "location_id": l.location_id,
                "location_name": loc.name if loc else "Unknown",
                "theoretical_quantity": l.theoretical_quantity,
                "counted_quantity": l.counted_quantity,
                "difference": l.counted_quantity - l.theoretical_quantity
            })
        result.append({
            "id": adj.id,
            "date": adj.date.isoformat(),
            "status": adj.status.value,
            "lines": line_data
        })
    return result

@router.post("/adjustments/{adj_id}/validate")
def validate_adjustment(adj_id: int, db: Session = Depends(get_db)):
    adj = db.query(models.StockAdjustment).filter_by(id=adj_id).first()
    if not adj:
        raise HTTPException(status_code=404, detail="Adjustment not found")
    if adj.status == models.PickingStatus.DONE:
        raise HTTPException(status_code=400, detail="Already validated")

    lines = db.query(models.StockAdjustmentLine).filter_by(adjustment_id=adj.id).all()
    for line in lines:
        quant = db.query(models.StockQuant).filter_by(
            product_id=line.product_id, location_id=line.location_id
        ).first()
        if quant:
            quant.quantity = line.counted_quantity
        else:
            new_quant = models.StockQuant(
                product_id=line.product_id,
                location_id=line.location_id,
                quantity=line.counted_quantity
            )
            db.add(new_quant)

    adj.status = models.PickingStatus.DONE
    db.commit()
    return {"message": "Adjustment validated and stock updated"}

