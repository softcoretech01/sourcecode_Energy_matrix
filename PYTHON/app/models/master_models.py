from sqlalchemy import Column, Integer, String, DateTime, Text, func, SmallInteger, TIME, DECIMAL, Date
from app.database import BaseMasters as Base

# =====================================================
# 🔵 CAPACITY MASTER TABLE (master_capacity)
# =====================================================
class CapacityMaster(Base):
    __tablename__ = "master_capacity"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    capacity = Column(String(50))
    status = Column(String(1)) # binary(1)
    
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
    is_submitted = Column(SmallInteger)

# =====================================================
# 🔵 EDC CIRCLE MASTER TABLE (master_edc_circle)
# =====================================================
class EDCCircleMaster(Base):
    __tablename__ = "master_edc_circle"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    edc_circle = Column(String(255))
    status = Column(String(1)) # binary(1)
    
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
    is_submitted = Column(SmallInteger)

# =====================================================
# 🔵 EMAIL MASTER TABLE (master_email)
# =====================================================
class EmailMaster(Base):
    __tablename__ = "master_email"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email_id = Column(String(100))
    email_category = Column(String(150))
    email_time = Column(TIME)
    occurrences = Column(Integer)
    emai_cc = Column(String(150))
    email_to = Column(String(200))
    email_subject = Column(String(200))
    email_content = Column(Text)
    
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
    is_submitted = Column(SmallInteger)

# =====================================================
# 🔵 INVESTOR MASTER TABLE (master_investors)
# =====================================================
class InvestorMaster(Base):
    __tablename__ = "master_investors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    investor_name = Column(String(255))
    share_quantity = Column(DECIMAL(15,2))
    
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
    status = Column(SmallInteger) # tinyint
    is_submitted = Column(SmallInteger)

# =====================================================
# 🔵 TRANSMISSION LOSS MASTER TABLE (transmission_loss_master)
# =====================================================
class TransmissionLossMaster(Base):
    __tablename__ = "transmission_loss_master"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    kva = Column(String(50))
    loss_percentage = Column(DECIMAL(5,2))
    valid_from = Column(Date)
    remarks = Column(String(500))
    
    is_submitted = Column(SmallInteger)
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)

# =====================================================
# 🔵 SHARE HOLDINGS MASTER TABLE (share_holdings_master)
# =====================================================
class ShareHoldingsMaster(Base):
    __tablename__ = "share_holdings_master"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer)
    share_quantity = Column(Integer)
    share_percentage = Column(DECIMAL(5,2))
    
    is_submitted = Column(SmallInteger)
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
# =====================================================
# 🔵 CONFIGURATION TABLE (configuration)
# =====================================================
class Configuration(Base):
    __tablename__ = "configuration"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    total_company_shares = Column(DECIMAL(15, 2))
    total_investor_shares = Column(DECIMAL(15, 2))
    total_customer_shares = Column(DECIMAL(15, 2))
    charge_formula = Column(String(255))
    
    is_submitted = Column(SmallInteger)
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)

# =====================================================
# 🔵 CONSUMPTION CHARGERS MASTER TABLE (master_consumption_chargers)
# =====================================================
class ConsumptionChargersMaster(Base):
    __tablename__ = "master_consumption_chargers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    energy_type = Column(String(100))
    charge_code = Column(String(100))
    charge_name = Column(String(200))
    cost = Column(DECIMAL(12, 2))
    uom = Column(String(50))
    type = Column(String(50))
    charge_description = Column(Text)
    valid_upto = Column(Date)
    discount_charges = Column(DECIMAL(12, 2))

    is_submitted = Column(SmallInteger)
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)