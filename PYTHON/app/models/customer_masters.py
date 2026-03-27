from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, BigInteger, func, SmallInteger, DECIMAL
from sqlalchemy.orm import relationship
from app.database import BaseMasters as Base

# =====================================================
# 🔵 USER TABLE
# =====================================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    email = Column(String(255), unique=True, index=True)
    password = Column(String(255))

# =====================================================
# 🔵 CUSTOMER TABLE (master_customers)
# =====================================================
class Customer(Base):
    __tablename__ = "master_customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_name = Column(String(255))
    city = Column(String(50))
    phone_no = Column(String(50))
    email = Column(String(150))
    address = Column(String(100))
    gst_number = Column(String(50))
    status = Column(String(1)) # binary(1)
    
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
    is_submitted = Column(SmallInteger)


# =====================================================
# 🔵 CUSTOMER AGREED TABLE (customer_agreed)
# =====================================================
class CustomerAgreed(Base):
    __tablename__ = "customer_agreed"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer)
    total_agreement_number = Column(Integer)
    month = Column(String(50))
    c1_units = Column(DECIMAL(10,0))
    c2_units = Column(DECIMAL(10,0))
    c4_units = Column(DECIMAL(10,0))
    c5_units = Column(DECIMAL(10,0))
    monthly_total = Column(Integer)
    grand_total = Column(Integer)
    
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
    is_submitted = Column(SmallInteger)


# =====================================================
# 🔵 CUSTOMER CONTACT TABLE (customer_contact)
# =====================================================
class CustomerContact(Base):
    __tablename__ = "customer_contact"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer)
    contact_person = Column(String(255))
    phone = Column(String(20))
    
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
    is_submitted = Column(SmallInteger)


# =====================================================
# 🔵 CUSTOMER SERVICE TABLE (customer_service)
# =====================================================
class CustomerService(Base):
    __tablename__ = "customer_service"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer)
    service_number = Column(BigInteger)
    kva_id = Column(Integer)
    edc_circle_id = Column(Integer)
    status = Column(String(1)) # binary(1)
    remarks = Column(String(50))
    per_cost_unit = Column(DECIMAL(10, 2), nullable=True)
    
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
    is_submitted = Column(SmallInteger)


# =====================================================
# 🔵 CUSTOMER UPLOADS TABLE (customer_uploads)
# =====================================================
class CustomerUpload(Base):
    __tablename__ = "customer_uploads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer)
    upload_ppa = Column(String(250))
    upload_share_transfer_form_certificate = Column(String(250))
    upload_share_certificate = Column(String(250))
    pledge_agreement = Column(String(250))
    share_holding_agreement = Column(String(250))
    
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
    is_submitted = Column(SmallInteger)