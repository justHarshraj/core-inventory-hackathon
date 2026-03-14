from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routes import auth_routes, product_routes, inventory_routes, dashboard_routes

app = FastAPI()

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)

app.include_router(auth_routes.router)
app.include_router(product_routes.router)
app.include_router(inventory_routes.router)
app.include_router(dashboard_routes.router)

@app.get("/")
def root():
    return {"message": "Hackathon API running"}
