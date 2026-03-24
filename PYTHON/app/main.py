from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
from app.utils.auth_utils import get_current_user
from app.database import initialize_database
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Routers
from app.routers.customer_router import router as customer_router
from app.routers.windmill_router import router as windmill_router
from app.routers.edc_router import router as edc_router
from app.routers.email_router import router as email_router
from app.routers.total_shares_router import router as total_router
from app.routers.customer_share_router import router as customer_share_router
from app.routers.eb_bill_router import router as eb_bill_router
from app.routers.eb_statement_upload import router as eb_upload_router   
from app.routers.eb_statement_solar import router as eb_solar_router
from app.routers.generation import router as generation
from app.routers.auth_routes import router as auth_routes
from app.routers.investors_routes import router as investors_routes
from app.routers.capacity_routes import router as capacity_routes
from app.routers.consumption_routes import router as consumption_routes
from app.routers.transmission_routes import router as transmission_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Running database initialization on startup...")
    initialize_database()
    yield
    print("Application shutdown.")

app = FastAPI(lifespan=lifespan, redirect_slashes=False)

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Serve uploaded files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API routes
auth_dep = [Depends(get_current_user)]

app.include_router(customer_router, prefix="/api", dependencies=auth_dep)
app.include_router(windmill_router, prefix="/api", dependencies=auth_dep)
app.include_router(edc_router, prefix="/api", dependencies=auth_dep)
app.include_router(email_router, prefix="/api", dependencies=auth_dep)
app.include_router(total_router, prefix="/api", dependencies=auth_dep)
app.include_router(customer_share_router, prefix="/api", dependencies=auth_dep)
app.include_router(eb_bill_router, prefix="/api", dependencies=auth_dep)

app.include_router(eb_upload_router, prefix="/api", dependencies=auth_dep)
app.include_router(eb_solar_router, prefix="/api", dependencies=auth_dep)
app.include_router(generation, prefix="/api", dependencies=auth_dep)
app.include_router(auth_routes, prefix="/api") # Auth routes are public
app.include_router(investors_routes, prefix="/api", dependencies=auth_dep)
app.include_router(capacity_routes, prefix="/api", dependencies=auth_dep)
app.include_router(consumption_routes, prefix="/api", dependencies=auth_dep)
from app.routers.consumption_request import router as consumption_req_router
app.include_router(consumption_req_router, prefix="/api") # We'll handle Depends(get_current_user) inside the routes to get the user object
app.include_router(transmission_routes, prefix="/api", dependencies=auth_dep)