import os
import secrets
import sys
from pathlib import Path
from decimal import Decimal
from datetime import date, datetime, timezone

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.orm import Session
from app.database import engine, Base
from app.models import Role, Category, Location, User, Item, Inventory, Asset, Supplier
import bcrypt

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def seed():
    print("Seeding database...")
    Base.metadata.create_all(bind=engine)
    
    with Session(engine) as db:
        # 1. Roles
        roles_data = [
            {"role_id": 1, "role_name": "ADMIN", "description": "Full system access and user management"},
            {"role_id": 2, "role_name": "MANAGER", "description": "Can edit inventory and view reports"},
            {"role_id": 3, "role_name": "VIEWER", "description": "Read-only access"}
        ]
        for r in roles_data:
            existing = db.get(Role, r["role_id"])
            if not existing:
                role = Role(role_id=r["role_id"], role_name=r["role_name"], description=r["description"])
                db.add(role)
        db.commit()

        # 2. Admin User
        admin_email = "admin@example.com"
        admin_password = os.environ.get("SEED_ADMIN_PASSWORD") or secrets.token_urlsafe(16)
        admin_user = db.query(User).filter_by(email=admin_email).first()
        if not admin_user:
            admin_user = User(
                role_id=1,
                username="admin",
                email=admin_email,
                password_hash=get_password_hash(admin_password),
                full_name="Alex Morgan",
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(admin_user)
            if os.environ.get("SEED_ADMIN_PASSWORD"):
                print(f"Admin user created: {admin_email} (password set via SEED_ADMIN_PASSWORD)")
            else:
                print(f"Admin user created: {admin_email}")
                print(f"  Auto-generated password: {admin_password}")
                print("  ⚠ Save this password now — it cannot be recovered.")
        else:
            print("Admin user already exists.")
        db.commit()

        # 3. Categories
        categories_data = [
            {"name": "IT Equipment", "description": "Laptops, servers, switches, routers, and firewalls"},
            {"name": "Vehicles", "description": "Cars, trucks, forklifts, and pallet jacks"},
            {"name": "Furniture", "description": "Desks, chairs, filing cabinets, and conference tables"},
            {"name": "Tools", "description": "Hand tools, power tools, and equipment kits"},
            {"name": "Safety Equipment", "description": "Helmets, extinguishers, and safety gear"},
            {"name": "Office Supplies", "description": "Printers, shredders, and stationary"},
            {"name": "Electronics", "description": "Backup generators, security cameras, and displays"}
        ]
        
        category_map = {}
        for c in categories_data:
            existing = db.query(Category).filter_by(name=c["name"]).first()
            if not existing:
                cat = Category(name=c["name"], description=c["description"])
                db.add(cat)
                db.flush() # populated ID
                category_map[c["name"]] = cat.category_id
            else:
                category_map[c["name"]] = existing.category_id
        db.commit()

        # 4. Locations
        locations_data = [
            {"name": "Main Warehouse A", "address": "1200 Industrial Blvd, Suite 100, Chicago, IL 60601", "is_active": True},
            {"name": "HQ Office Floor 3", "address": "55 West Monroe St, Floor 3, Chicago, IL 60603", "is_active": True},
            {"name": "Production Floor B", "address": "1200 Industrial Blvd, Building B, Chicago, IL 60601", "is_active": True},
            {"name": "Storage Unit C4", "address": "890 Storage Park, Unit C4, Oak Park, IL 60301", "is_active": True},
            {"name": "Remote Site - Detroit", "address": "4500 Gratiot Ave, Detroit, MI 48207", "is_active": True}
        ]
        
        location_map = {}
        for loc in locations_data:
            existing = db.query(Location).filter_by(name=loc["name"]).first()
            if not existing:
                l = Location(name=loc["name"], address=loc["address"], is_active=loc["is_active"])
                db.add(l)
                db.flush()
                location_map[loc["name"]] = l.location_id
            else:
                location_map[loc["name"]] = existing.location_id
        db.commit()

        # 5. Seed Items, Assets, and Inventory records
        # Dell XPS 15 Laptop
        existing_item = db.query(Item).filter_by(sku="AST-2024-0001").first()
        if not existing_item:
            item1 = Item(
                category_id=category_map["IT Equipment"],
                name="Dell XPS 15 Laptop",
                sku="AST-2024-0001",
                reorder_level=5,
                unit_price=Decimal("1899.99")
            )
            db.add(item1)
            db.flush()
            
            # Inventory
            inv1 = Inventory(
                item_id=item1.item_id,
                location_id=location_map["HQ Office Floor 3"],
                quantity_on_hand=12,
                last_updated=datetime.now(timezone.utc)
            )
            db.add(inv1)
            
            # Asset
            asset1 = Asset(
                item_id=item1.item_id,
                serial_number="DXP15-2024-7A83",
                location_id=location_map["HQ Office Floor 3"],
                status="Active",
                purchase_date=date(2024, 1, 10),
                created_at=datetime.now(timezone.utc)
            )
            db.add(asset1)
            print("Seeded Dell XPS Laptop records.")
            
        # Forklift
        existing_item = db.query(Item).filter_by(sku="AST-2024-0002").first()
        if not existing_item:
            item2 = Item(
                category_id=category_map["Vehicles"],
                name="Forklift — Toyota 8FGU25",
                sku="AST-2024-0002",
                reorder_level=2,
                unit_price=Decimal("28500.00")
            )
            db.add(item2)
            db.flush()
            
            # Inventory
            inv2 = Inventory(
                item_id=item2.item_id,
                location_id=location_map["Main Warehouse A"],
                quantity_on_hand=3,
                last_updated=datetime.now(timezone.utc)
            )
            db.add(inv2)
            
            # Asset
            asset2 = Asset(
                item_id=item2.item_id,
                serial_number="TYFT-8FGU-0092",
                location_id=location_map["Main Warehouse A"],
                status="Maintenance",
                purchase_date=date(2022, 6, 15),
                created_at=datetime.now(timezone.utc)
            )
            db.add(asset2)
            print("Seeded Forklift records.")
            
        # Ergonomic Chair
        existing_item = db.query(Item).filter_by(sku="AST-2024-0003").first()
        if not existing_item:
            item3 = Item(
                category_id=category_map["Furniture"],
                name="Ergonomic Office Chair",
                sku="AST-2024-0003",
                reorder_level=10,
                unit_price=Decimal("1495.00")
            )
            db.add(item3)
            db.flush()
            
            inv3 = Inventory(
                item_id=item3.item_id,
                location_id=location_map["HQ Office Floor 3"],
                quantity_on_hand=45,
                last_updated=datetime.now(timezone.utc)
            )
            db.add(inv3)
            print("Seeded Ergonomic Office Chair records.")

        db.commit()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed()
