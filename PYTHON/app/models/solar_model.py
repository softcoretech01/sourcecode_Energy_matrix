from sqlalchemy import Column, Integer, String, DateTime, DECIMAL, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import BaseSolar as Base


# =====================================================
# 🔆 EB STATEMENT SOLAR DETAILS (eb_statement_solar_details)
# =====================================================
class EBStatementSolarDetails(Base):
    __tablename__ = "eb_statement_solar_details"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    eb_header_id = Column(Integer, ForeignKey("eb_statement_solar.id"), nullable=False)
    company_name = Column(String(255))
    solar_id = Column(Integer)
    slots = Column(Integer)
    net_unit = Column(DECIMAL(12, 2))
    created_by = Column(Integer)
    created_at = Column(DateTime, default=func.now())

    eb_header = relationship("EBStatementSolar", backref="details")


# =====================================================
# 🔆 EB STATEMENT SOLAR APPLICABLE CHARGES (eb_statement_solar_applicable_charges)
# =====================================================
class EBStatementSolarApplicableCharges(Base):
    __tablename__ = "eb_statement_solar_applicable_charges"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    eb_header_id = Column(Integer, ForeignKey("eb_statement_solar.id"), nullable=False)
    charge_id = Column(Integer)
    total_charge = Column(DECIMAL(12, 2))
    created_by = Column(Integer)
    created_at = Column(DateTime, default=func.now())

    eb_header = relationship("EBStatementSolar", backref="applicable_charges")
