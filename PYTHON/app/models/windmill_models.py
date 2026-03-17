from sqlalchemy import Column, Integer, String, Date, Float, DateTime, ForeignKey, Text, func, SmallInteger, BigInteger, DECIMAL, Enum
from sqlalchemy.orm import relationship
from app.database import BaseWindmill as Base


# =====================================================
# 🔵 ACTUAL TABLE (actual)
# =====================================================
class Actual(Base):
    __tablename__ = "actual"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer)
    service_number_id = Column(Integer)
    actual_year = Column(Integer)   # year
    actual_month = Column(SmallInteger) # tinyint
    pdf_file_path = Column(String(255))
    
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
    is_submitted = Column(SmallInteger)


# =====================================================
# 🔵 EB BILL TABLE (eb_bill)
# =====================================================
class EBBill(Base):
    __tablename__ = "eb_bill"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer)
    service_number_id = Column(Integer)
    bill_year = Column(Integer)   # year
    bill_month = Column(SmallInteger) # tinyint
    pdf_file_path = Column(String(255))
    
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
    is_submitted = Column(SmallInteger)


# =====================================================
# 🔵 EB STATEMENTS TABLE (eb_statements)
# =====================================================
class EBStatements(Base):
    __tablename__ = "eb_statements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    windmill_id = Column(Integer)
    month = Column(String(20))
    year = Column(Integer, nullable=False)
    pdf_file_path = Column(String(255))
    
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
    is_submitted = Column(SmallInteger)


# =====================================================
# 🔵 EB STATEMENTS DETAILS (eb_statements_details)
# =====================================================
class EBStatementsDetails(Base):
    __tablename__ = "eb_statements_details"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    eb_header_id = Column(Integer, ForeignKey("eb_statements.id"), nullable=False)
    company_name = Column(String(255))
    windmill_id = Column(Integer)
    slots = Column(Integer)
    net_unit = Column(DECIMAL(12, 2))
    banking_units = Column(DECIMAL(12, 2))
    created_by = Column(Integer)
    created_at = Column(DateTime, default=func.now())

    eb_header = relationship("EBStatements", backref="details")


# =====================================================
# 🔵 EB STATEMENTS APPLICABLE CHARGES (eb_statements_applicable_charges)
# =====================================================
class EBStatementsApplicableCharges(Base):
    __tablename__ = "eb_statements_applicable_charges"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    eb_header_id = Column(Integer, ForeignKey("eb_statements.id"), nullable=False)
    charge_id = Column(Integer)
    total_charge = Column(DECIMAL(12, 2))
    created_by = Column(Integer)
    created_at = Column(DateTime, default=func.now())

    eb_header = relationship("EBStatements", backref="applicable_charges")


# =====================================================
# 🔵 EB STATEMENTS TOTAL BANKING UNITS (eb_statements_total_banking_units)
# =====================================================
class EBStatementsTotalBankingUnits(Base):
    __tablename__ = "eb_statements_total_banking_units"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    eb_header_id = Column(Integer, ForeignKey("eb_statements.id"), nullable=False)
    total_banking_units = Column(DECIMAL(12, 2))
    created_by = Column(Integer)
    created_at = Column(DateTime, default=func.now())

    eb_header = relationship("EBStatements", backref="total_banking_units")


# =====================================================
# 🔵 WINDMILL DAILY TRANSACTION (windmill_daily_transaction)
# =====================================================
class DailyGeneration(Base):
    __tablename__ = "windmill_daily_transaction"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    region = Column(String(50)) # enum('Tamil Nadu', 'Karnataka')
    transaction_date = Column(Date)
    windmill_number = Column(String(50))
    units = Column(DECIMAL(10,2))
    status = Column(SmallInteger) # tinyint
    expected_resume_date = Column(Date)
    remarks = Column(String(500))
    
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
    is_submitted = Column(SmallInteger)

# =====================================================
# 🔵 CUSTOMER CONSUMPTION REQUEST (customer_consumption_requests)
# =====================================================
class CustomerConsumptionRequest(Base):
    __tablename__ = "customer_consumption_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, nullable=False)
    service_id = Column(Integer, nullable=False)
    c1 = Column(DECIMAL(10, 2), default=0.00)
    c2 = Column(DECIMAL(10, 2), default=0.00)
    c4 = Column(DECIMAL(10, 2), default=0.00)
    c5 = Column(DECIMAL(10, 2), default=0.00)
    total = Column(DECIMAL(12, 2), default=0.00)
    billing_year = Column(Integer, nullable=False)
    billing_month = Column(SmallInteger, nullable=False)
    billing_day = Column(SmallInteger, nullable=False)
    
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
    is_submitted = Column(SmallInteger, default=0)
