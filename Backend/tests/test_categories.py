import pytest

def test_list_categories_empty(client):
    response = client.get("/categories")
    assert response.status_code == 200
    assert response.json() == []

def test_create_category_success(client):
    payload = {"name": "Electronics", "description": "Electronic devices"}
    response = client.post("/categories", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Electronics"
    assert "category_id" in data

def test_create_category_duplicate(client):
    payload = {"name": "Books", "description": "Reading material"}
    client.post("/categories", json=payload)
    response = client.post("/categories", json=payload)
    assert response.status_code == 400

def test_create_category_invalid_payload(client):
    payload = {"description": "Missing name"}
    response = client.post("/categories", json=payload)
    assert response.status_code == 422

def test_list_categories(client):
    client.post("/categories", json={"name": "Cat1"})
    client.post("/categories", json={"name": "Cat2"})
    
    response = client.get("/categories")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    names = [c["name"] for c in data]
    assert "Cat1" in names
    assert "Cat2" in names

def test_get_category_success(client):
    create_resp = client.post("/categories", json={"name": "SingleCat"})
    cat_id = create_resp.json()["category_id"]
    
    response = client.get(f"/categories/{cat_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "SingleCat"

def test_get_category_not_found(client):
    response = client.get("/categories/9999")
    assert response.status_code == 404
