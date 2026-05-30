import pytest

def test_list_locations_empty(client):
    response = client.get("/locations")
    assert response.status_code == 200
    assert response.json() == []

def test_create_location_success(client):
    payload = {"name": "Warehouse A", "address": "123 Main St", "is_active": True}
    response = client.post("/locations", json=payload)
    assert response.status_code == 201
    assert response.json()["name"] == "Warehouse A"

def test_create_location_duplicate(client):
    payload = {"name": "Warehouse B"}
    client.post("/locations", json=payload)
    response = client.post("/locations", json=payload)
    assert response.status_code == 400
    
def test_create_location_invalid_payload(client):
    payload = {"address": "Missing name"}
    response = client.post("/locations", json=payload)
    assert response.status_code == 422

def test_list_locations(client):
    client.post("/locations", json={"name": "Loc1"})
    response = client.get("/locations")
    assert response.status_code == 200
    assert len(response.json()) >= 1

def test_get_location_success(client):
    resp = client.post("/locations", json={"name": "Loc2"})
    loc_id = resp.json()["location_id"]
    response = client.get(f"/locations/{loc_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Loc2"

def test_get_location_not_found(client):
    response = client.get("/locations/9999")
    assert response.status_code == 404

def test_update_location(client):
    resp = client.post("/locations", json={"name": "Loc3"})
    loc_id = resp.json()["location_id"]
    
    update_payload = {"name": "Loc3 Updated", "is_active": False}
    response = client.put(f"/locations/{loc_id}", json=update_payload)
    assert response.status_code == 200
    assert response.json()["name"] == "Loc3 Updated"
    assert response.json()["is_active"] is False

def test_update_location_not_found(client):
    response = client.put("/locations/9999", json={"name": "Does not matter"})
    assert response.status_code == 404
    
def test_delete_location(client):
    resp = client.post("/locations", json={"name": "Loc4"})
    loc_id = resp.json()["location_id"]
    
    response = client.delete(f"/locations/{loc_id}")
    assert response.status_code == 204
    
    get_resp = client.get(f"/locations/{loc_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["is_active"] is False
    
def test_delete_location_not_found(client):
    response = client.delete("/locations/9999")
    assert response.status_code == 404
