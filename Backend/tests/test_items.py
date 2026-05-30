import pytest

@pytest.fixture
def setup_item_prereqs(client):
    client.post("/categories", json={"name": "ItemCat"})
    loc_resp = client.post("/locations", json={"name": "ItemLoc"})
    return {
        "category_name": "ItemCat",
        "location_id": loc_resp.json()["location_id"]
    }

def test_list_items_empty(client):
    response = client.get("/items")
    assert response.status_code == 200
    assert response.json()["total"] == 0

def test_create_item_success(client, setup_item_prereqs):
    payload = {
        "name": "Laptop",
        "sku": "LAP123",
        "category_name": setup_item_prereqs["category_name"],
        "location_id": setup_item_prereqs["location_id"],
        "quantity": 10,
        "unit_price": 999.99,
        "reorder_level": 2,
        "status": "Active"
    }
    response = client.post("/items", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Laptop"
    assert data["sku"] == "LAP123"

def test_create_item_duplicate_sku(client, setup_item_prereqs):
    payload = {
        "name": "Tablet",
        "sku": "TAB123",
        "category_name": setup_item_prereqs["category_name"],
        "location_id": setup_item_prereqs["location_id"],
        "quantity": 5,
        "unit_price": 499.99,
        "reorder_level": 1,
        "status": "Active"
    }
    client.post("/items", json=payload)
    response = client.post("/items", json=payload)
    assert response.status_code == 400

def test_create_item_invalid_payload(client):
    payload = {"name": "Laptop"} # Missing SKU
    response = client.post("/items", json=payload)
    assert response.status_code == 422
    
def test_list_items(client, setup_item_prereqs):
    payload = {
        "name": "Mouse",
        "sku": "MOU123",
        "quantity": 50,
        "unit_price": 19.99,
        "status": "Active"
    }
    client.post("/items", json=payload)
    response = client.get("/items")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any(i["sku"] == "MOU123" for i in data["items"])

def test_get_item_success(client, setup_item_prereqs):
    payload = {
        "name": "Keyboard",
        "sku": "KEY123",
        "quantity": 20,
        "unit_price": 49.99,
        "status": "Active"
    }
    resp = client.post("/items", json=payload)
    item_id = resp.json()["item_id"]
    
    response = client.get(f"/items/{item_id}")
    assert response.status_code == 200
    assert response.json()["sku"] == "KEY123"

def test_get_item_not_found(client):
    response = client.get("/items/9999")
    assert response.status_code == 404

def test_update_item_success(client, setup_item_prereqs):
    payload = {
        "name": "Monitor",
        "sku": "MON123",
        "category_name": setup_item_prereqs["category_name"],
        "location_id": setup_item_prereqs["location_id"],
        "quantity": 15,
        "unit_price": 199.99,
        "status": "Active"
    }
    resp = client.post("/items", json=payload)
    item_id = resp.json()["item_id"]
    
    update_payload = {
        "name": "Monitor 4K",
        "quantity": 25
    }
    response = client.put(f"/items/{item_id}", json=update_payload)
    assert response.status_code == 200
    assert response.json()["name"] == "Monitor 4K"
    assert response.json()["total_quantity"] == 25

def test_update_item_not_found(client):
    response = client.put("/items/9999", json={"name": "Nope"})
    assert response.status_code == 404
    
def test_delete_item_success(client, setup_item_prereqs):
    payload = {
        "name": "Trash",
        "sku": "TRH123",
        "category_name": setup_item_prereqs["category_name"],
        "location_id": setup_item_prereqs["location_id"],
        "quantity": 1,
        "unit_price": 1.99,
        "status": "Active"
    }
    resp = client.post("/items", json=payload)
    item_id = resp.json()["item_id"]
    
    response = client.delete(f"/items/{item_id}")
    assert response.status_code == 204
    
    get_resp = client.get(f"/items/{item_id}")
    assert get_resp.status_code == 404

def test_delete_item_not_found(client):
    response = client.delete("/items/9999")
    assert response.status_code == 404
